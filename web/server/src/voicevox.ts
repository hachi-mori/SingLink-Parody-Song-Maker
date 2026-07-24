import type { JsonObject, SolvedTask } from '../../shared/src/types';
import {
  buildMemorizationSynthesisPlan,
  extractOnomatopoeiaLineCorrects,
  type PhraseRange
} from '../../shared/src/memorizationScore';
import { trimWavLeadingFrames } from '../../shared/src/wav';
import {
  getKeyAdjustment,
  transposeScoreJSON,
  transposeSingQueryJSON,
  type ScoreJson,
  type ScoreNote
} from '../../shared/src/vvproj';
import { concatWavBuffers } from './wav';

const normalSpeakerId = 3003;
const singingQuerySpeakerId = 6000;

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref();
  return controller.signal;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function postJson(url: string, body: unknown, timeoutMs = 60_000): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: withTimeout(timeoutMs)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`VOICEVOX API エラー: ${response.status} ${response.statusText}${text ? ` / ${text}` : ''}`);
  }

  return response;
}

async function createSingQuery(score: ScoreJson, baseUrl: string): Promise<JsonObject> {
  const response = await postJson(`${baseUrl}/sing_frame_audio_query?speaker=${singingQuerySpeakerId}`, score);
  return (await response.json()) as JsonObject;
}

async function synthesizeFrame(query: JsonObject, speakerId: number, baseUrl: string): Promise<Buffer> {
  const response = await postJson(`${baseUrl}/frame_synthesis?speaker=${speakerId}`, query, 120_000);
  return Buffer.from(await response.arrayBuffer());
}

function tuneQuery(query: JsonObject): JsonObject {
  return {
    ...query,
    volumeScale: 1.0,
    outputSamplingRate: 44100,
    outputStereo: true
  };
}

function applyKeyShiftToScore(score: ScoreJson, keyShift: number): ScoreJson {
  let working = score;
  if (keyShift < -12) {
    working = transposeScoreJSON(working, -12);
  }
  if (keyShift < -20) {
    working = transposeScoreJSON(working, -12);
  }
  if (keyShift !== 0) {
    working = transposeScoreJSON(working, -keyShift);
  }
  return working;
}

function splitScore(score: ScoreJson, maxFrames: number): ScoreJson[] {
  const segments: ScoreJson[] = [];
  let current: ScoreNote[] = [];
  let frameSum = 0;

  for (const note of score.notes) {
    current.push({ ...note });
    frameSum += note.frame_length;
    const isRest = note.notelen === 'R';

    if (frameSum >= maxFrames && isRest) {
      current.pop();
      const restFrame = Math.max(1, note.frame_length);
      if (restFrame >= 2) {
        const half1 = Math.floor(restFrame / 2);
        const half2 = restFrame - half1;
        current.push({ frame_length: half1, key: null, lyric: '', notelen: 'R' });
        segments.push({ notes: current });
        current = [{ frame_length: half2, key: null, lyric: '', notelen: 'R' }];
      } else {
        current.push({ ...note });
        segments.push({ notes: current });
        current = [];
      }
      frameSum = current.reduce((sum, item) => sum + item.frame_length, 0);
    }
  }

  if (current.length > 0) {
    segments.push({ notes: current });
  }

  return segments.length > 0 ? segments : [{ notes: score.notes }];
}

async function synthesizeScoreSegment(score: ScoreJson, speakerId: number, baseUrl: string, keyShift: number): Promise<Buffer> {
  let query = await createSingQuery(score, baseUrl);
  if (keyShift !== 0) {
    query = transposeSingQueryJSON(query, keyShift);
  }
  query = tuneQuery(query);
  return synthesizeFrame(query, speakerId, baseUrl);
}

export async function getVoicevoxVersion(baseUrl: string): Promise<string> {
  const normalized = normalizeBaseUrl(baseUrl);
  const response = await fetch(`${normalized}/version`, { signal: withTimeout(5_000) });
  if (!response.ok) {
    throw new Error(`VOICEVOX に接続できませんでした: ${response.status}`);
  }
  const body = await response.json();
  return typeof body === 'string' ? body : String(body);
}

export async function synthesizeSongScore(
  score: ScoreJson,
  baseUrlRaw: string,
  solvedTasks: SolvedTask[],
  songTitle: string,
  phraseRanges?: ReadonlyArray<PhraseRange>
): Promise<Buffer> {
  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const keyShift = getKeyAdjustment('ずんだもん', 'ノーマル');

  if (songTitle === 'オノマトペ' && phraseRanges?.length) {
    const shiftedScore = keyShift !== 0 ? transposeScoreJSON(score, -keyShift) : score;
    const plan = buildMemorizationSynthesisPlan(
      shiftedScore,
      phraseRanges,
      extractOnomatopoeiaLineCorrects(solvedTasks)
    );
    const wavs: Buffer[] = [];
    let processedPaddingFrames = 0;
    for (const segment of plan) {
      const wav = await synthesizeScoreSegment(segment.score, segment.speakerId, baseUrl, keyShift);
      wavs.push(Buffer.from(trimWavLeadingFrames(
        wav,
        segment.leadingPaddingFrames,
        processedPaddingFrames
      )));
      processedPaddingFrames += segment.leadingPaddingFrames;
    }
    return concatWavBuffers(wavs);
  }

  const shiftedScore = applyKeyShiftToScore(score, keyShift);
  const segments = splitScore(shiftedScore, 2500);
  const wavs: Buffer[] = [];

  for (const segment of segments) {
    wavs.push(await synthesizeScoreSegment(segment, normalSpeakerId, baseUrl, keyShift));
  }

  return concatWavBuffers(wavs);
}
