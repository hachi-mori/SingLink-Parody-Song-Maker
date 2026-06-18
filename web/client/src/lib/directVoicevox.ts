import type { JsonObject, SolvedTask, SongDetail } from '@shared/types';
import {
  applyParodyLyrics,
  convertVVProjToScoreJSON,
  getKeyAdjustment,
  transposeScoreJSON,
  transposeSingQueryJSON,
  type ScoreJson,
  type ScoreNote
} from '@shared/vvproj';

const normalSpeakerId = 3003;
const incorrectSpeakerId = 3076;
const singingQuerySpeakerId = 6000;

type SynthesisSegment = {
  score: ScoreJson;
  speakerId: number;
  keyShift: number;
};

type WavParts = {
  fmt: Uint8Array;
  data: Uint8Array[];
};

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
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
    signal: timeoutSignal(timeoutMs)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`VOICEVOX API エラー: ${response.status} ${response.statusText}${text ? ` / ${text}` : ''}`);
  }
  return response;
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
    if (frameSum < maxFrames || note.notelen !== 'R') {
      continue;
    }

    current.pop();
    const restFrame = Math.max(1, note.frame_length);
    if (restFrame >= 2) {
      const firstHalf = Math.floor(restFrame / 2);
      const secondHalf = restFrame - firstHalf;
      current.push({ frame_length: firstHalf, key: null, lyric: '', notelen: 'R' });
      segments.push({ notes: current });
      current = [{ frame_length: secondHalf, key: null, lyric: '', notelen: 'R' }];
    } else {
      current.push({ ...note });
      segments.push({ notes: current });
      current = [];
    }
    frameSum = current.reduce((sum, item) => sum + item.frame_length, 0);
  }

  if (current.length > 0) {
    segments.push({ notes: current });
  }
  return segments.length > 0 ? segments : [{ notes: score.notes }];
}

function extractOnomatopoeiaLineCorrects(tasks: SolvedTask[]): boolean[] {
  return tasks
    .filter((task) => task.restPadding && task.syllables.length === 6 && task.syllables[0] === 'ル')
    .map((task) => task.isCorrect !== false);
}

function buildSegments(score: ScoreJson, tasks: SolvedTask[], songTitle: string): SynthesisSegment[] {
  const keyShift = getKeyAdjustment('ずんだもん', 'ノーマル');
  if (songTitle !== 'オノマトペ' || score.notes.length < 48) {
    return splitScore(applyKeyShiftToScore(score, keyShift), 2500)
      .map((segment) => ({ score: segment, speakerId: normalSpeakerId, keyShift }));
  }

  const shiftedScore = keyShift !== 0 ? transposeScoreJSON(score, -keyShift) : score;
  const lineCorrects = extractOnomatopoeiaLineCorrects(tasks);
  const ranges: Array<[number, number]> = [
    [0, 16],
    [16, 31],
    [31, 47],
    [47, shiftedScore.notes.length]
  ];

  return ranges.flatMap(([start, end], index) => {
    const notes = shiftedScore.notes.slice(start, Math.min(end, shiftedScore.notes.length)).map((note) => ({ ...note }));
    if (notes.length === 0) {
      return [];
    }
    if (notes[0]?.notelen !== 'R') {
      notes.unshift({ frame_length: 2, key: null, lyric: '', notelen: 'R' });
    }
    return [{
      score: { notes },
      speakerId: index < 3 && lineCorrects[index] === false ? incorrectSpeakerId : normalSpeakerId,
      keyShift
    }];
  });
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function parseWav(buffer: ArrayBuffer): WavParts {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 12 || readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    throw new Error('VOICEVOXからWAVではないデータが返されました');
  }

  let fmt: Uint8Array | undefined;
  const data: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = readAscii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    if (dataStart + size > bytes.length) {
      break;
    }
    if (id === 'fmt ') {
      fmt = bytes.slice(dataStart, dataStart + size);
    } else if (id === 'data') {
      data.push(bytes.slice(dataStart, dataStart + size));
    }
    offset = dataStart + size + (size % 2);
  }

  if (!fmt || data.length === 0) {
    throw new Error('WAVのfmt/dataチャンクを読み取れませんでした');
  }
  return { fmt, data };
}

function writeAscii(output: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    output[offset + index] = value.charCodeAt(index);
  }
}

function concatWavBuffers(buffers: ArrayBuffer[]): Blob {
  if (buffers.length === 0) {
    throw new Error('連結するWAVがありません');
  }
  if (buffers.length === 1) {
    return new Blob([buffers[0] as ArrayBuffer], { type: 'audio/wav' });
  }

  const parsed = buffers.map(parseWav);
  const fmt = parsed[0]?.fmt;
  if (!fmt) {
    throw new Error('WAVのfmtチャンクを読み取れませんでした');
  }
  const dataLength = parsed.reduce((total, part) => total + part.data.reduce((sum, chunk) => sum + chunk.length, 0), 0);
  const output = new Uint8Array(12 + 8 + fmt.length + 8 + dataLength);
  const view = new DataView(output.buffer);
  writeAscii(output, 0, 'RIFF');
  view.setUint32(4, output.length - 8, true);
  writeAscii(output, 8, 'WAVE');
  writeAscii(output, 12, 'fmt ');
  view.setUint32(16, fmt.length, true);
  output.set(fmt, 20);

  const dataHeaderOffset = 20 + fmt.length;
  writeAscii(output, dataHeaderOffset, 'data');
  view.setUint32(dataHeaderOffset + 4, dataLength, true);
  let dataOffset = dataHeaderOffset + 8;
  for (const part of parsed) {
    for (const chunk of part.data) {
      output.set(chunk, dataOffset);
      dataOffset += chunk.length;
    }
  }
  return new Blob([output], { type: 'audio/wav' });
}

async function synthesizeSegment(segment: SynthesisSegment, baseUrl: string): Promise<ArrayBuffer> {
  const queryResponse = await postJson(
    `${baseUrl}/sing_frame_audio_query?speaker=${singingQuerySpeakerId}`,
    segment.score
  );
  let query = (await queryResponse.json()) as JsonObject;
  if (segment.keyShift !== 0) {
    query = transposeSingQueryJSON(query, segment.keyShift);
  }
  query = tuneQuery(query);

  const wavResponse = await postJson(
    `${baseUrl}/frame_synthesis?speaker=${segment.speakerId}`,
    query,
    120_000
  );
  return wavResponse.arrayBuffer();
}

export async function checkDirectVoicevox(baseUrlRaw: string): Promise<string> {
  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const response = await fetch(`${baseUrl}/version`, {
    cache: 'no-store',
    signal: timeoutSignal(5_000)
  });
  if (!response.ok) {
    throw new Error(`VOICEVOXに接続できませんでした: ${response.status}`);
  }
  const version = await response.json() as unknown;
  return typeof version === 'string' ? version : String(version);
}

export async function synthesizeDirectVoicevox(
  song: SongDetail,
  tasks: SolvedTask[],
  baseUrlRaw: string
): Promise<Blob> {
  const vvprojResponse = await fetch(song.vvprojUrl);
  if (!vvprojResponse.ok) {
    throw new Error('曲のvvprojデータを読み込めませんでした');
  }
  const vvproj = await vvprojResponse.json() as unknown;
  const modified = applyParodyLyrics(vvproj, tasks);
  const score = convertVVProjToScoreJSON(modified, 0);
  const segments = buildSegments(score, tasks, song.title);
  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const wavs: ArrayBuffer[] = [];

  for (const segment of segments) {
    wavs.push(await synthesizeSegment(segment, baseUrl));
  }
  return concatWavBuffers(wavs);
}
