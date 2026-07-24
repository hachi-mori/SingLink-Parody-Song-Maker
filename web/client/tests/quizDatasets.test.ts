import { describe, expect, it } from 'vitest';
import {
  isLocalBookQuizRound,
  normalizeQuizDatasets,
  savesHistoryForDataset,
  supportsEnglishForDataset
} from '../src/lib/quizDatasets';

describe('quiz datasets', () => {
  const localEntry = (index: number) => ({
    word: `fixture-${index}`,
    reading: `fixture-${index}`,
    answer: `fixture-${index}`,
    explanation: `meaning-${index}`,
    questionText: `○○ usage-${index}`,
    displayText: `fixture-${index} usage-${index}`,
    singingReading: `reading-${index}`
  });

  it('uses only the original dataset when the local API is unavailable', () => {
    expect(normalizeQuizDatasets(undefined)).toEqual([
      expect.objectContaining({ id: 'original335', localOnly: false, supportsEnglish: true })
    ]);
  });

  it('shows the local dataset only when explicitly advertised by the API', () => {
    const datasets = normalizeQuizDatasets({
      datasets: [{
        id: 'localBook100',
        label: 'このPC内の書籍教材100語',
        localOnly: true,
        supportsEnglish: false
      }]
    });
    expect(datasets.map((dataset) => dataset.id)).toEqual(['original335', 'localBook100']);
  });

  it('requires exactly four local book entries and keeps them out of history', () => {
    const validEntries = [0, 1, 2, 3].map(localEntry);
    expect(isLocalBookQuizRound({ datasetId: 'localBook100', entries: validEntries })).toBe(true);
    expect(isLocalBookQuizRound({ datasetId: 'localBook100', entries: validEntries.slice(0, 3) })).toBe(false);
    expect(isLocalBookQuizRound({ datasetId: 'localBook100', entries: [{}, {}, {}, {}] })).toBe(false);
    expect(isLocalBookQuizRound({
      datasetId: 'localBook100',
      entries: [localEntry(0), localEntry(0), localEntry(2), localEntry(3)]
    })).toBe(false);
    expect(supportsEnglishForDataset('localBook100')).toBe(false);
    expect(savesHistoryForDataset('localBook100')).toBe(false);
  });
});
