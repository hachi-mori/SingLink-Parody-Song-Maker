import type { DatasetId, OnomatopoeiaEntry, QuizDataset, QuizRound } from '@shared/types';

export const original335Dataset: QuizDataset = {
  id: 'original335',
  label: '自作オノマトペ335語',
  localOnly: false,
  supportsEnglish: true
};

function isDatasetId(value: unknown): value is DatasetId {
  return value === 'original335' || value === 'localBook100';
}

function isQuizDataset(value: unknown): value is QuizDataset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuizDataset>;
  return isDatasetId(candidate.id)
    && typeof candidate.label === 'string'
    && typeof candidate.localOnly === 'boolean'
    && typeof candidate.supportsEnglish === 'boolean';
}

/**
 * Keeps the public dataset available even when the local API is absent or
 * returns an unexpected response. The local book is accepted only when the
 * server explicitly advertises it.
 */
export function normalizeQuizDatasets(value: unknown): QuizDataset[] {
  const candidates = value && typeof value === 'object' && Array.isArray((value as { datasets?: unknown }).datasets)
    ? (value as { datasets: unknown[] }).datasets
    : [];
  const localBook = candidates.find((dataset) => isQuizDataset(dataset) && dataset.id === 'localBook100');
  return localBook && isQuizDataset(localBook)
    ? [original335Dataset, localBook]
    : [original335Dataset];
}

export function supportsEnglishForDataset(datasetId: DatasetId): boolean {
  return datasetId === 'original335';
}

export function savesHistoryForDataset(datasetId: DatasetId): boolean {
  return datasetId === 'original335';
}

function isLocalBookEntry(value: unknown): value is OnomatopoeiaEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<OnomatopoeiaEntry>;
  return typeof entry.word === 'string'
    && entry.word.trim().length > 0
    && typeof entry.reading === 'string'
    && entry.reading.trim().length > 0
    && typeof entry.answer === 'string'
    && entry.answer.trim().length > 0
    && typeof entry.explanation === 'string'
    && typeof entry.questionText === 'string'
    && entry.questionText.includes('○○')
    && typeof entry.displayText === 'string'
    && entry.displayText.trim().length > 0
    && typeof entry.singingReading === 'string'
    && entry.singingReading.trim().length > 0
    && entry.englishMeaning === undefined
    && entry.englishExample === undefined;
}

export function isLocalBookQuizRound(value: unknown): value is QuizRound {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuizRound>;
  if (candidate.datasetId !== 'localBook100' || !Array.isArray(candidate.entries) || candidate.entries.length !== 4) {
    return false;
  }
  const entries = candidate.entries;
  return entries.every(isLocalBookEntry)
    && new Set(entries.map((entry) => entry.answer)).size === entries.length;
}
