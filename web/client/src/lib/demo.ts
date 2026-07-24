import type { KaraokeLineTiming, OnomatopoeiaEntry, SolvedTask, SongDetail } from '@shared/types';
import type { GeneratedResult } from './generatedResult';
import { assetUrl } from './assets';

type DemoManifestLine = {
  japanese: string;
  singingReading: string;
  keyword: string;
  englishExample: string;
  englishMeaning: string;
};

type DemoManifest = {
  version: 1;
  id: string;
  title: { ja: string; en: string };
  disclosure: { ja: string; en: string };
  sourceSong: {
    id: string;
    title: string;
    scorePath: string;
    accompanimentPath: string;
  };
  voice: {
    path: string;
    credit: string;
    engineVersion: string;
    speakerId: number;
    style: string;
  };
  accompaniment: { path: string; credit: string };
  lines: DemoManifestLine[];
  karaokeTimings: KaraokeLineTiming[];
};

export type DemoBundle = {
  song: SongDetail;
  questions: OnomatopoeiaEntry[];
  tasks: SolvedTask[];
  fullLyrics: string;
  result: GeneratedResult;
  disclosure: DemoManifest['disclosure'];
  credits: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertDemoManifest(value: unknown): asserts value is DemoManifest {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== 'string') {
    throw new Error('Demo manifest is invalid.');
  }
  if (!isRecord(value.title) || typeof value.title.ja !== 'string' || typeof value.title.en !== 'string') {
    throw new Error('Demo title is missing.');
  }
  if (!isRecord(value.disclosure) || typeof value.disclosure.ja !== 'string' || typeof value.disclosure.en !== 'string') {
    throw new Error('Demo disclosure is missing.');
  }
  if (!isRecord(value.sourceSong)
    || typeof value.sourceSong.id !== 'string'
    || typeof value.sourceSong.title !== 'string'
    || typeof value.sourceSong.scorePath !== 'string'
    || typeof value.sourceSong.accompanimentPath !== 'string') {
    throw new Error('Demo source song metadata is invalid.');
  }
  if (!isRecord(value.voice) || typeof value.voice.path !== 'string' || typeof value.voice.credit !== 'string') {
    throw new Error('Demo voice metadata is invalid.');
  }
  if (!isRecord(value.accompaniment) || typeof value.accompaniment.path !== 'string' || typeof value.accompaniment.credit !== 'string') {
    throw new Error('Demo accompaniment metadata is invalid.');
  }
  if (!Array.isArray(value.lines) || value.lines.length === 0 || !Array.isArray(value.karaokeTimings)) {
    throw new Error('Demo lyrics or timings are missing.');
  }
  if (value.lines.length !== value.karaokeTimings.length) {
    throw new Error('Demo lyrics and timings have different line counts.');
  }
  for (const line of value.lines) {
    if (!isRecord(line)
      || typeof line.japanese !== 'string'
      || typeof line.singingReading !== 'string'
      || typeof line.keyword !== 'string'
      || typeof line.englishExample !== 'string'
      || typeof line.englishMeaning !== 'string') {
      throw new Error('A demo lyric line is invalid.');
    }
    if (!line.japanese.includes(line.keyword)) {
      throw new Error('A demo question is missing its answer.');
    }
  }
}

async function fetchRequired(url: string, label: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} could not be loaded (${response.status}).`);
  return response;
}

export async function loadDemoBundle(): Promise<DemoBundle> {
  const manifestUrl = assetUrl('assets/demo/manifest.json');
  const manifestResponse = await fetchRequired(manifestUrl, 'Demo manifest');
  const manifest = await manifestResponse.json() as unknown;
  assertDemoManifest(manifest);

  const voiceUrl = assetUrl(manifest.voice.path);
  const voiceResponse = await fetchRequired(voiceUrl, 'Demo voice');
  const voiceBlob = await voiceResponse.blob();
  if (!voiceBlob.type.includes('wav') && !voiceBlob.type.includes('wave')) {
    const header = new Uint8Array(await voiceBlob.slice(0, 4).arrayBuffer());
    if (String.fromCharCode(...header) !== 'RIFF') throw new Error('Demo voice is not a WAV file.');
  }

  const tasks: SolvedTask[] = manifest.lines.map((line) => ({
    phrase: line.japanese,
    syllables: Array.from(line.singingReading),
    userInput: line.keyword,
    userSyllables: Array.from(line.keyword),
    isCorrect: true,
    singingReading: line.singingReading,
    englishExample: line.englishExample,
    englishMeaning: line.englishMeaning
  }));
  const questions: OnomatopoeiaEntry[] = manifest.lines.map((line) => ({
    word: line.keyword,
    reading: line.keyword,
    answer: line.keyword,
    explanation: line.englishMeaning,
    questionText: line.japanese.replace(line.keyword, '○○'),
    displayText: line.japanese,
    singingReading: line.singingReading,
    englishExample: line.englishExample,
    englishMeaning: line.englishMeaning,
    translationReviewStatus: 'reviewed'
  }));
  const accompanimentUrl = assetUrl(manifest.accompaniment.path);
  const song: SongDetail = {
    id: manifest.id,
    title: 'オノマトペ',
    vvprojFileName: 'manifest.json',
    vvprojUrl: manifestUrl,
    instFileName: manifest.accompaniment.path.split('/').at(-1),
    instUrl: accompanimentUrl,
    mode: 'onomatopoeiaQuiz',
    trackName: manifest.title.ja,
    problems: [],
    onomatopoeiaEntries: questions,
    sourceSong: {
      id: manifest.sourceSong.id,
      title: manifest.sourceSong.title,
      scoreFileName: manifest.sourceSong.scorePath.split('/').at(-1) ?? 'score.json',
      scoreUrl: assetUrl(manifest.sourceSong.scorePath),
      instFileName: manifest.accompaniment.path.split('/').at(-1) ?? 'accompaniment.wav',
      instUrl: accompanimentUrl
    }
  };

  return {
    song,
    questions,
    tasks,
    fullLyrics: manifest.lines.map((line) => line.japanese).join('\n'),
    result: {
      status: 'generated',
      source: 'demo',
      blob: voiceBlob,
      blobUrl: voiceUrl,
      fileName: manifest.voice.path.split('/').at(-1) ?? 'singlink-demo.wav',
      karaokeTimings: manifest.karaokeTimings
    },
    disclosure: manifest.disclosure,
    credits: [manifest.voice.credit, manifest.accompaniment.credit]
  };
}
