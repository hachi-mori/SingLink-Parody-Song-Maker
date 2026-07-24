import fs from 'node:fs/promises';
import { onomatopoeiaQuestionsPerGame } from '../../shared/src/gameLogic';
import { parseOnomatopoeiaCardEntries } from '../../shared/src/onomatopoeiaCards';
import type { OnomatopoeiaEntry, QuizRound } from '../../shared/src/types';
import { getLocalBookDictPaths } from './paths';

const expectedLocalBookEntryCount = 100;

export class LocalBookDatasetUnavailableError extends Error {
  constructor() {
    super('Local book dataset is unavailable');
  }
}

async function readJson(filePath: string): Promise<unknown> {
  const text = (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
  return JSON.parse(text) as unknown;
}

function validateEntries(entries: OnomatopoeiaEntry[]): OnomatopoeiaEntry[] {
  if (entries.length !== expectedLocalBookEntryCount || new Set(entries.map((entry) => entry.answer)).size !== expectedLocalBookEntryCount) {
    throw new LocalBookDatasetUnavailableError();
  }
  for (const entry of entries) {
    if (!entry.questionText || !entry.displayText || !entry.singingReading || entry.englishMeaning || entry.englishExample) {
      throw new LocalBookDatasetUnavailableError();
    }
  }
  return entries.map((entry) => ({
    word: entry.word,
    reading: entry.reading,
    answer: entry.answer,
    explanation: entry.explanation,
    questionText: entry.questionText,
    displayText: entry.displayText,
    singingReading: entry.singingReading
  }));
}

export async function loadLocalBookEntries(dataRoot: string | undefined): Promise<OnomatopoeiaEntry[]> {
  if (!dataRoot) {
    throw new LocalBookDatasetUnavailableError();
  }
  try {
    const { cardsPath, singingReadingsPath } = getLocalBookDictPaths(dataRoot);
    const [cards, singingReadings] = await Promise.all([readJson(cardsPath), readJson(singingReadingsPath)]);
    return validateEntries(parseOnomatopoeiaCardEntries(cards, singingReadings));
  } catch (error) {
    if (error instanceof LocalBookDatasetUnavailableError) throw error;
    throw new LocalBookDatasetUnavailableError();
  }
}

function randomIndex(random: () => number, upperBound: number): number {
  return Math.min(upperBound - 1, Math.max(0, Math.floor(random() * upperBound)));
}

export async function createLocalBookQuizRound(dataRoot: string | undefined, random = Math.random): Promise<QuizRound> {
  const candidates = [...await loadLocalBookEntries(dataRoot)];
  const entries: OnomatopoeiaEntry[] = [];
  while (entries.length < onomatopoeiaQuestionsPerGame) {
    const selected = candidates.splice(randomIndex(random, candidates.length), 1)[0];
    if (!selected) throw new LocalBookDatasetUnavailableError();
    entries.push(selected);
  }
  return { datasetId: 'localBook100', entries };
}
