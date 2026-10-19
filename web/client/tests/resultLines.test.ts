import { describe, expect, it } from 'vitest';
import { buildOnomatopoeiaResultLyrics, buildOnomatopoeiaTasks } from '@shared/gameLogic';
import type { KaraokeLineTiming, OnomatopoeiaEntry, SolvedTask } from '@shared/types';
import { buildResultLines } from '../src/lib/resultLines';

function makeEntry(index: number, hasReading: boolean): OnomatopoeiaEntry {
  return {
    word: `答え${index}`, reading: 'こつこつ', answer: `答え${index}`,
    explanation: `説明${index}`, displayText: `例文${index}。`,
    singingReading: hasReading ? 'こつこつれんしゅうする' : undefined,
    englishExample: `Example ${index}`, englishMeaning: `Meaning ${index}`
  };
}

function makeTiming(index: number): KaraokeLineTiming {
  return { startSeconds: index * 10, endSeconds: index * 10 + 5, noteTimings: [] };
}

describe('result lines keep question metadata separate from singing availability', () => {
  it.each([
    ['all readings', [true, true, true, true]],
    ['first missing', [false, true, true, true]],
    ['middle missing', [true, false, true, true]],
    ['last missing', [true, true, true, false]],
    ['all missing', [false, false, false, false]]
  ] as const)('%s retains each answer and English subtitle', (_name, readings) => {
    const entries = readings.map((hasReading, index) => makeEntry(index, hasReading));
    const tasks = entries.flatMap((entry, index) => buildOnomatopoeiaTasks(entry, index === 1 ? '誤答' : entry.answer, index !== 1));
    const timings = entries.filter((entry) => entry.singingReading).map((_entry, index) => makeTiming(index));
    const rows = buildResultLines(buildOnomatopoeiaResultLyrics(entries), tasks, timings, 'onomatopoeiaQuiz');

    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.task?.isCorrect)).toEqual([true, false, true, true]);
    expect(rows.map((row) => row.task?.englishExample)).toEqual(entries.map((entry) => entry.englishExample));
    expect(rows.map((row) => row.task?.englishMeaning)).toEqual(entries.map((entry) => entry.englishMeaning));
    let singingIndex = 0;
    for (let index = 0; index < rows.length; index++) {
      expect(rows[index]?.task).toBe(tasks[index * 2 + 1]);
      expect(rows[index]?.timing).toBe(readings[index] ? timings[singingIndex++] : undefined);
    }

    const silentRows = buildResultLines(buildOnomatopoeiaResultLyrics(entries), tasks, [], 'onomatopoeiaQuiz');
    expect(silentRows.map((row) => row.task?.isCorrect)).toEqual([true, false, true, true]);
    expect(silentRows.every((row) => row.timing === undefined)).toBe(true);
  });

  it('does not join repeated display text by its contents', () => {
    const entries = [makeEntry(0, false), makeEntry(1, true)];
    entries.forEach((entry) => { entry.displayText = '同じ例文。'; });
    const tasks = entries.flatMap((entry, index) => buildOnomatopoeiaTasks(entry, entry.answer, index === 0));
    const timing = makeTiming(0);
    const rows = buildResultLines(buildOnomatopoeiaResultLyrics(entries), tasks, [timing], 'onomatopoeiaQuiz');
    expect(rows.map((row) => row.text)).toEqual(['同じ例文。', '同じ例文。']);
    expect(rows.map((row) => row.task?.isCorrect)).toEqual([true, false]);
    expect(rows.map((row) => row.task?.englishExample)).toEqual(['Example 0', 'Example 1']);
    expect(rows.map((row) => row.timing)).toEqual([undefined, timing]);
  });

  it('preserves the one-task-per-line demo format and every timing', () => {
    const tasks: SolvedTask[] = Array.from({ length: 4 }, (_, index) => ({
      phrase: `デモ例文${index}`, syllables: [], userInput: 'こつこつ', userSyllables: [],
      singingReading: 'こつこつ', isCorrect: true, englishExample: `Demo ${index}`
    }));
    const timings = tasks.map((_task, index) => makeTiming(index));
    const rows = buildResultLines(tasks.map((task) => task.phrase).join('\n'), tasks, timings, 'onomatopoeiaQuiz');
    expect(rows.map((row) => row.task)).toEqual(tasks);
    expect(rows.map((row) => row.timing)).toEqual(timings);
  });
});
