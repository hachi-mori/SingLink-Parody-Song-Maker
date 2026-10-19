import { describe, expect, it, vi } from 'vitest';
import {
  assertPublicDataset,
  importLimits,
  parseImportedDataset,
  readImportedDataset,
  savesHistoryForDataset,
  supportsEnglishForDataset
} from '../src/lib/quizDatasets';
import type { DatasetId } from '@shared/types';

const row = (index: number) => ({
  answer: `fixture-${index}`,
  explanation: `Synthetic meaning ${index}`,
  questionText: `Synthetic ○○ example ${index}`
});
const rows = () => [0, 1, 2, 3].map(row);
const json = (entries: unknown = rows()) => JSON.stringify({ entries });

describe('browser-only teaching material import', () => {
  it('reads a minimal dataset without singing readings', () => {
    const entries = parseImportedDataset(json());
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({
      ...row(0), word: 'fixture-0', reading: 'fixture-0', displayText: 'Synthetic fixture-0 example 0'
    });
    expect(entries[0]?.singingReading).toBeUndefined();
  });

  it('supports the legacy records format without copying extra metadata', () => {
    const records = rows().map((entry) => ({
      onomatopoeia: entry.answer,
      meanings: [{ text: entry.explanation }],
      usages: [{ text: `Synthetic ${entry.answer} example` }],
      url: 'https://example.invalid/private',
      readings: { unnecessary: true }
    }));
    const entries = parseImportedDataset(JSON.stringify({ records, metadata: { unused: true } }));
    expect(entries[0]?.questionText).toBe('Synthetic ○○ example');
    expect(entries[0]).not.toHaveProperty('url');
    expect(entries[0]).not.toHaveProperty('readings');
  });

  it('accepts optional local singing readings in both supported formats', () => {
    const records = rows().map((entry) => ({ onomatopoeia: entry.answer, meanings: [{ text: entry.explanation }], usages: [{ text: entry.answer }] }));
    const readings = Object.fromEntries(rows().map((entry) => [entry.answer, 'かくうのれいぶん']));
    expect(parseImportedDataset(JSON.stringify({ records, readings })).every((entry) => entry.singingReading === 'かくうのれいぶん')).toBe(true);
    expect(parseImportedDataset(json(rows().map((entry) => ({ ...entry, singingReading: 'かくうのれいぶん' })))).every((entry) => entry.singingReading === 'かくうのれいぶん')).toBe(true);
    expect(() => parseImportedDataset(JSON.stringify({ records, readings: { 'fixture-0': 42 } }))).toThrow();
    expect(() => parseImportedDataset(json(rows().map((entry) => ({ ...entry, singingReading: 'x'.repeat(2001) }))))).toThrow();
  });

  it('keeps markup as text and strips unsupported fields', () => {
    const entries = rows();
    entries[0]!.questionText = '<img src=x onerror=alert(1)> ○○';
    const parsed = parseImportedDataset(JSON.stringify({ entries: entries.map((entry) => ({
      ...entry, __proto__: null, html: '<script>alert(1)</script>', englishExample: 'not imported', url: 'javascript:alert(1)'
    })) }));
    expect(parsed[0]?.questionText).toBe('<img src=x onerror=alert(1)> ○○');
    expect(parsed[0]).not.toHaveProperty('html');
    expect(parsed[0]).not.toHaveProperty('url');
    expect(parsed[0]).not.toHaveProperty('englishExample');
  });

  it.each([
    'null', '[]', '{}', '{"entries":"wrong"}', '{"entries":[null]}',
    json(rows().slice(0, 3)),
    json([row(0), row(0), row(2), row(3)]),
    json([row(0), row(1), row(2), { ...row(3), answer: '' }]),
    json([row(0), row(1), row(2), { ...row(3), questionText: 'No blank' }]),
    json([row(0), row(1), row(2), { ...row(3), reading: 123 }]),
    json([row(0), row(1), row(2), { ...row(3), explanation: 'unsafe\u0000text' }]),
    json([row(0), row(1), row(2), { ...row(3), answer: 'x'.repeat(81) }]),
    json([row(0), row(1), row(2), { ...row(3), explanation: 'x'.repeat(2001) }]),
    json(Array.from({ length: 1001 }, (_, index) => row(index)))
  ])('rejects malformed or excessive input without partial import', (text) => {
    expect(() => parseImportedDataset(text)).toThrow();
  });

  it('validates every legacy meaning and example rather than silently dropping invalid cards', () => {
    const records = rows().map((entry) => ({ onomatopoeia: entry.answer, meanings: [{ text: entry.explanation }], usages: [{ text: entry.answer }] }));
    records[3]!.usages = [{ text: 'missing answer' }];
    expect(() => parseImportedDataset(JSON.stringify({ records }))).toThrow();
    records[3]!.usages = [{ text: 'fixture-3' }];
    records[3]!.meanings = Array.from({ length: 17 }, () => ({ text: 'synthetic' }));
    expect(() => parseImportedDataset(JSON.stringify({ records }))).toThrow();
  });

  it('enforces the UTF-8 byte limit and accepts the entry-count boundary', () => {
    expect(() => parseImportedDataset('あ'.repeat(Math.ceil(importLimits.bytes / 3)))).toThrow(/2 MiB/);
    expect(parseImportedDataset(json(Array.from({ length: 1000 }, (_, index) => row(index))))).toHaveLength(1000);
  });

  it('checks file size and type before reading any content', async () => {
    const text = vi.fn(async () => json());
    for (const invalid of [
      { name: 'test.html', type: 'application/json', size: 100 },
      { name: 'test.json', type: 'text/html', size: 100 },
      { name: 'test.json', type: 'application/json', size: 0 },
      { name: 'test.json', type: 'application/json', size: importLimits.bytes + 1 }
    ]) {
      await expect(readImportedDataset({ ...invalid, text })).rejects.toThrow();
    }
    expect(text).not.toHaveBeenCalled();
  });

  it('reads JSON files with an optional BOM and does not reveal parse or read errors', async () => {
    await expect(readImportedDataset({ name: 'test.JSON', type: '', size: 100, text: async () => `\uFEFF${json()}` })).resolves.toHaveLength(4);
    const secret = 'PRIVATE-SYNTHETIC-MARKER';
    await expect(readImportedDataset({ name: `${secret}.json`, type: '', size: 100, text: async () => { throw new Error(secret); } })).rejects.not.toThrow(secret);
    expect(() => parseImportedDataset(`{"${secret}`)).not.toThrow(secret);
  });

  it('allows device-local history but denies external API routes for imported material', () => {
    expect(supportsEnglishForDataset('browserImport')).toBe(false);
    expect(savesHistoryForDataset('browserImport')).toBe(true);
    expect(() => assertPublicDataset('browserImport')).toThrow();
    expect(() => assertPublicDataset(undefined as unknown as DatasetId)).toThrow();
    expect(() => assertPublicDataset('original335')).not.toThrow();
  });
});
