import type { DatasetId, OnomatopoeiaEntry, QuizDataset } from '@shared/types';

export const original335Dataset: QuizDataset = {
  id: 'original335',
  label: '自作オノマトペ335語',
  localOnly: false,
  supportsEnglish: true
};

export const browserImportDataset: QuizDataset = {
  id: 'browserImport',
  label: 'このタブのインポート教材',
  localOnly: true,
  supportsEnglish: false
};

export const importLimits = {
  bytes: 2 * 1024 * 1024,
  minEntries: 4,
  maxEntries: 1000,
  answerCharacters: 80,
  textCharacters: 2000,
  textItems: 16
} as const;

export const privateDatasetNotice = '教材一覧はこのタブのメモリ内で扱います。歌声生成時だけ同じPCのVOICEVOXへ送信し、生成した音声・歌詞はこのブラウザ内の履歴に保存します。外部サーバー・クラウドAI・分析・同期には送りません。教材の解除・再読み込みでは履歴は消えません。履歴画面から個別に削除できます。';
export const localVoicevoxNotice = '公開ページから同じPCのVOICEVOXへの接続には、ブラウザのローカルネットワーク許可やVOICEVOXのCORS設定が必要な場合があります。接続できなくてもクイズは利用できます。接続先は http://localhost:50021、http://127.0.0.1:50021、http://[::1]:50021 のみです。';

export function supportsEnglishForDataset(datasetId: DatasetId): boolean {
  return datasetId === 'original335';
}

export function savesHistoryForDataset(datasetId: DatasetId): boolean {
  return datasetId === 'original335' || datasetId === 'browserImport';
}

export function assertKnownDataset(datasetId: DatasetId): void {
  if (datasetId !== 'original335' && datasetId !== 'browserImport') throw new Error('教材の種類が不明です。');
}

/** External API routes are never available to imported material. */
export function assertPublicDataset(datasetId: DatasetId): void {
  if (datasetId !== 'original335') {
    throw new Error('インポート教材を外部APIへ送信することはできません。');
  }
}

function invalidFile(): never {
  // Never include a filename, JSON parser error or any teaching text in errors.
  throw new Error('教材JSONの形式が正しくありません。4〜1000件の異なる答えと、意味・穴埋め問題または答えを含む例文を確認してください。');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readText(value: unknown, maxLength: number = importLimits.textCharacters): string {
  if (typeof value !== 'string' || value.length > maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) invalidFile();
  const text = value.trim();
  if (!text) invalidFile();
  return text;
}

function readTextItems(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > importLimits.textItems) invalidFile();
  return value.map((item) => {
    if (!isRecord(item)) invalidFile();
    return readText(item.text);
  });
}

function parseLegacyEntry(value: unknown, readings?: Record<string, unknown>): OnomatopoeiaEntry {
  if (!isRecord(value)) invalidFile();
  const answer = readText(value.onomatopoeia, importLimits.answerCharacters);
  const explanation = readText(readTextItems(value.meanings).join(' / '));
  const usages = readTextItems(value.usages);
  const displayText = usages.find((usage) => usage.includes(answer));
  if (!displayText) invalidFile();
  const rawReading = readings && Object.hasOwn(readings, answer) ? readings[answer] : undefined;
  const singingReading = rawReading === undefined ? undefined : readText(rawReading);
  return { word: answer, reading: answer, answer, explanation, displayText, questionText: displayText.replace(answer, '○○'), singingReading };
}

function parseEntry(value: unknown): OnomatopoeiaEntry {
  if (!isRecord(value)) invalidFile();
  const answer = readText(value.answer, importLimits.answerCharacters);
  const explanation = readText(value.explanation);
  const questionText = readText(value.questionText);
  if (!questionText.includes('○○')) invalidFile();
  const displayText = value.displayText === undefined
    ? readText(questionText.replaceAll('○○', answer))
    : readText(value.displayText);
  const reading = value.reading === undefined ? answer : readText(value.reading);
  const singingReading = value.singingReading === undefined ? undefined : readText(value.singingReading);
  // Copy only supported text fields. Imported URLs, markup, metadata and settings
  // never become DOM attributes, network destinations or storage records.
  return { word: answer, reading, answer, explanation, questionText, displayText, singingReading };
}

export function parseImportedDataset(text: string): OnomatopoeiaEntry[] {
  if (new TextEncoder().encode(text).byteLength > importLimits.bytes) {
    throw new Error('教材ファイルは2 MiB以下にしてください。');
  }
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/u, '')) as unknown;
  } catch {
    invalidFile();
  }
  if (!isRecord(value)) invalidFile();
  const legacy = Array.isArray(value.records);
  const rows = legacy ? value.records : value.entries;
  if (!Array.isArray(rows) || rows.length < importLimits.minEntries || rows.length > importLimits.maxEntries) invalidFile();
  if (value.readings !== undefined && !isRecord(value.readings)) invalidFile();
  const readings = isRecord(value.readings) ? value.readings : undefined;
  if (readings && Object.keys(readings).length > importLimits.maxEntries) invalidFile();
  const entries = rows.map((row) => legacy ? parseLegacyEntry(row, readings) : parseEntry(row));
  if (new Set(entries.map((entry) => entry.answer)).size !== entries.length) invalidFile();
  return entries;
}

export async function readImportedDataset(file: Pick<File, 'name' | 'type' | 'size' | 'text'>): Promise<OnomatopoeiaEntry[]> {
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > importLimits.bytes) {
    throw new Error('空でない2 MiB以下の教材JSONを選んでください。');
  }
  const acceptedTypes = ['', 'application/json', 'text/json', 'text/plain', 'application/octet-stream'];
  if (!/\.json$/iu.test(file.name) || !acceptedTypes.includes(file.type.toLowerCase())) {
    throw new Error('教材は .json ファイルで読み込んでください。');
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error('教材ファイルを読み込めませんでした。現在の教材は変更していません。');
  }
  return parseImportedDataset(text);
}
