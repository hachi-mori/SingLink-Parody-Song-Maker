import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createLocalBookQuizRound, LocalBookDatasetUnavailableError, loadLocalBookEntries } from '../src/localBookDataset';

const temporaryDirectories: string[] = [];

async function createFixture(entryCount = 100): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'singlink-local-book-fixture-'));
  temporaryDirectories.push(directory);
  const records = Array.from({ length: entryCount }, (_, index) => {
    const word = `fixture-${index}`;
    return {
      number: index + 1,
      onomatopoeia: word,
      usages: [{ text: `${word} usage` }],
      meanings: [{ text: `meaning-${index}` }]
    };
  });
  const readings = Object.fromEntries(records.map((record) => [record.onomatopoeia, `reading-${record.number}`]));
  await fs.writeFile(path.join(directory, 'cards_text_data.json'), JSON.stringify({ record_count: entryCount, records }), 'utf8');
  await fs.writeFile(path.join(directory, 'cards_singing_readings.json'), JSON.stringify({ record_count: entryCount, readings }), 'utf8');
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe('local book dataset', () => {
  it('creates exactly four unique, Japanese-only API entries from a complete local fixture', async () => {
    const root = await createFixture();
    const round = await createLocalBookQuizRound(root, () => 0);

    expect(round.datasetId).toBe('localBook100');
    expect(round.entries).toHaveLength(4);
    expect(new Set(round.entries.map((entry) => entry.answer)).size).toBe(4);
    expect(round.entries.every((entry) => entry.questionText?.includes('○○'))).toBe(true);
    expect(round.entries.every((entry) => entry.singingReading)).toBe(true);
    expect(round.entries.every((entry) => entry.englishMeaning === undefined && entry.englishExample === undefined)).toBe(true);
  });

  it('does not make an incomplete fixture available', async () => {
    const root = await createFixture(99);
    await expect(loadLocalBookEntries(root)).rejects.toBeInstanceOf(LocalBookDatasetUnavailableError);
  });

  it('does not make a missing data root available', async () => {
    await expect(createLocalBookQuizRound(undefined)).rejects.toBeInstanceOf(LocalBookDatasetUnavailableError);
  });
});
