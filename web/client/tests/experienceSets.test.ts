import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { SongDetail } from '@shared/types';
import { buildOnomatopoeiaResultLyrics, buildOnomatopoeiaTasks } from '@shared/gameLogic';
import { createMemorizationScore } from '@shared/memorizationScore';
import { parseImportedDataset, parseImportedMaterial, readImportedMaterial } from '../src/lib/quizDatasets';
import { prepareOnomatopoeiaOptions, selectOnomatopoeiaQuestions } from '../src/lib/quizSelection';

// Entirely synthetic fixtures; no book data is embedded in tracked tests.
function fixture(setId = 'main-a') {
  return {
    format: 'singlink-experience-set', version: 1, setId, title: `架空セット ${setId}`,
    entries: ['ああ', 'いい', 'うう', 'ええ'].map((answer, index) => ({
      id: `synthetic-${index}`, answer, explanation: `架空の意味 ${index}`,
      questionText: `架空の○○例文 ${index}。`, displayText: `架空の${answer}例文 ${index}。`,
      singingReading: 'かくうのれいぶん', choices: ['おお', answer, 'かか']
    }))
  };
}

function asSong(material: ReturnType<typeof parseImportedMaterial>): SongDetail {
  return {
    id: 'synthetic', title: 'オノマトペ', mode: 'onomatopoeiaQuiz',
    vvprojFileName: '', vvprojUrl: '', problems: [],
    onomatopoeiaEntries: material.entries, experienceSet: material.experienceSet
  };
}

afterEach(() => vi.restoreAllMocks());

describe('versioned fixed experience sets', () => {
  it.each(['main-a', 'main-b', 'main-c', 'reserve'])('reads the complete %s file contract without randomizing questions or choices', async (setId) => {
    const fileText = JSON.stringify(fixture(setId));
    const material = await readImportedMaterial({
      name: `${setId}.json`, type: 'application/json', size: new TextEncoder().encode(fileText).length,
      text: async () => fileText
    });
    expect(material.experienceSet).toEqual({ setId, title: `架空セット ${setId}` });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Fixed sets must not randomize'); });
    const questions = selectOnomatopoeiaQuestions(asSong(material));
    expect(questions.map((entry) => entry.id)).toEqual(fixture(setId).entries.map((entry) => entry.id));
    for (const [index, question] of questions.entries()) {
      const selection = prepareOnomatopoeiaOptions(material.entries, question)!;
      expect(selection.options).toEqual(fixture(setId).entries[index]!.choices);
      expect(selection.options[selection.correctIndex]).toBe(question.answer);
      expect(selection.correctIndex).toBe(1);
    }
    expect(random).not.toHaveBeenCalled();
  });

  it('returns fresh selections, so a caller cannot reorder the stored set', () => {
    const material = parseImportedMaterial(JSON.stringify(fixture()));
    selectOnomatopoeiaQuestions(asSong(material)).reverse();
    prepareOnomatopoeiaOptions(material.entries, material.entries[0]!)!.options.reverse();
    expect(material.entries.map((entry) => entry.id)).toEqual(fixture().entries.map((entry) => entry.id));
    expect(material.entries[0]!.choices).toEqual(fixture().entries[0]!.choices);
  });

  it('replaces the whole material on another import, without merging sets or retaining an old order', () => {
    let active = parseImportedMaterial(JSON.stringify(fixture('main-a')));
    const next = fixture('reserve');
    next.entries.reverse();
    active = parseImportedMaterial(JSON.stringify(next));
    expect(active.experienceSet?.setId).toBe('reserve');
    expect(selectOnomatopoeiaQuestions(asSong(active)).map((entry) => entry.id)).toEqual(next.entries.map((entry) => entry.id));
  });

  it.each<[string, (value: any) => void]>([
    ['unsupported version', (value: any) => { value.version = 2; }],
    ['unrecognized format', (value: any) => { value.format = 'singlink-experience-set-typo'; }],
    ['missing format on identified set', (value: any) => { delete value.format; }],
    ['foreign format on identified set', (value: any) => { value.format = 'cards-v1'; }],
    ['missing set ID on reserved format', (value: any) => { delete value.setId; }],
    ['reserved marker typo without set ID', (value: any) => { value.format = 'singlink-experience-set-v2'; delete value.setId; }],
    ['padded reserved marker without set ID', (value: any) => { value.format = ' singlink-experience-set '; delete value.setId; }],
    ['missing title', (value: any) => { delete value.title; }],
    ['invalid identifier', (value: any) => { value.setId = '../other'; }],
    ['too few questions', (value: any) => { value.entries.pop(); }],
    ['too many questions', (value: any) => { value.entries.push(value.entries[0]); }],
    ['duplicate entry IDs', (value: any) => { value.entries[1].id = value.entries[0].id; }],
    ['duplicate answers', (value: any) => { value.entries[1] = { ...value.entries[0], id: 'other' }; }],
    ['two choices', (value: any) => { value.entries[0].choices.pop(); }],
    ['duplicate choices', (value: any) => { value.entries[0].choices[2] = value.entries[0].choices[0]; }],
    ['missing correct choice', (value: any) => { value.entries[0].choices[1] = 'ささ'; }],
    ['missing reading', (value: any) => { delete value.entries[0].singingReading; }],
    ['missing full lyric', (value: any) => { delete value.entries[0].displayText; }],
    ['different full lyric', (value: any) => { value.entries[0].displayText = '別の架空例文'; }],
    ['multiple blanks', (value: any) => { value.entries[0].questionText += '○○'; }],
    ['legacy ambiguity', (value: any) => { value.records = []; }]
  ])('rejects %s before using any question', (_label, mutate) => {
    const value = fixture();
    mutate(value);
    expect(() => parseImportedMaterial(JSON.stringify(value))).toThrow();
  });

  it('does not copy URLs or unrelated metadata, or reveal rejected content in errors', () => {
    const value = fixture();
    Object.assign(value, { sourceUrl: 'https://private.invalid/source' });
    Object.assign(value.entries[0]!, { image: 'https://private.invalid/image' });
    const material = parseImportedMaterial(JSON.stringify(value));
    expect(JSON.stringify(material)).not.toContain('private.invalid');
    value.entries[0]!.choices = ['PRIVATE-SYNTHETIC-CANARY'];
    expect(() => parseImportedMaterial(JSON.stringify(value))).not.toThrow('PRIVATE-SYNTHETIC-CANARY');
  });

  it('keeps plain entries imports random and strips fixed-set-only fields', () => {
    const material = parseImportedMaterial(JSON.stringify({ entries: fixture().entries }));
    expect(material.experienceSet).toBeUndefined();
    expect(material.entries[0]).not.toHaveProperty('choices');
    expect(material.entries[0]).not.toHaveProperty('id');
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const questions = selectOnomatopoeiaQuestions(asSong(material));
    expect(questions).toHaveLength(4);
    expect(new Set(questions.map((entry) => entry.answer)).size).toBe(4);
    expect(random).toHaveBeenCalled();
    for (const question of questions) {
      const selected = prepareOnomatopoeiaOptions(material.entries, question)!;
      expect(selected.options).toHaveLength(3);
      expect(new Set(selected.options).size).toBe(3);
      expect(selected.options.filter((answer) => answer === question.answer)).toHaveLength(1);
    }
    expect(parseImportedDataset(JSON.stringify({ entries: fixture().entries }))).toEqual(material.entries);
  });

  it.each(['entries', 'records'] as const)('keeps unrelated root format metadata compatible with legacy %s', (kind) => {
    const entries = fixture().entries;
    const rows = kind === 'entries' ? entries : entries.map((entry) => ({
      onomatopoeia: entry.answer, usages: [{ text: entry.displayText }], meanings: [{ text: entry.explanation }]
    }));
    const expected = parseImportedMaterial(JSON.stringify({ [kind]: rows }));
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    for (const format of ['cards-v1', null, 42, { owner: 'synthetic' }]) {
      const material = parseImportedMaterial(JSON.stringify({ format, [kind]: rows }));
      expect(material).toEqual(expected);
      expect(material.experienceSet).toBeUndefined();
      expect(material.entries.every((entry) => entry.id === undefined && entry.choices === undefined)).toBe(true);
      const round = selectOnomatopoeiaQuestions(asSong(material));
      expect(round).toHaveLength(4);
      expect(new Set(round.map((entry) => entry.answer)).size).toBe(4);
    }
    expect(random).toHaveBeenCalled();
  });

  it.each<[string, boolean[]]>([
    ['all correct', [true, true, true, true]],
    ['all incorrect', [false, false, false, false]],
    ['mixed', [true, false, true, false]]
  ])('keeps four complete singing phrases after %s answers', (_label, correct) => {
    const material = parseImportedMaterial(JSON.stringify(fixture()));
    const questions = selectOnomatopoeiaQuestions(asSong(material));
    const tasks = questions.flatMap((question, index) => buildOnomatopoeiaTasks(question, correct[index] ? question.answer : 'おお', correct[index]!));
    expect(tasks).toHaveLength(8);
    expect(tasks.filter((task) => task.singingReading)).toHaveLength(4);
    expect(tasks.filter((task) => task.singingReading).map((task) => task.isCorrect)).toEqual(correct);
    const lyrics = buildOnomatopoeiaResultLyrics(questions);
    expect(lyrics.split('\n')).toEqual(fixture().entries.map((entry) => entry.displayText));
    const baseScore = JSON.parse(readFileSync(new URL('../../assets/score/幸せなら手をたたこう.json', import.meta.url), 'utf8').replace(/^\uFEFF/u, ''));
    const lyricsRows = tasks.filter((task) => task.singingReading).map((task, index) => [questions[index]!.displayText!, task.singingReading!] as const);
    const score = createMemorizationScore(lyricsRows, baseScore);
    expect(score.phraseRanges).toHaveLength(4);
  });
});
