import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildOnomatopoeiaTasks } from '../src/gameLogic';
import { buildOnomatopoeiaLyricsRows, createMemorizationScore, type MemorizationScoreJson } from '../src/memorizationScore';
import { memorizationSourceSongs } from '../src/memorizationSongs';
import { parseOnomatopoeiaCardEntries } from '../src/onomatopoeiaCards';

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8').replace(/^\uFEFF/, '')) as unknown;
}

const cardsJson = readJson('assets/dict/cards_text_data.json');
const readingsJson = readJson('assets/dict/cards_singing_readings.json');
const entries = parseOnomatopoeiaCardEntries(cardsJson, readingsJson);

describe('100語のオノマトペカード', () => {
  it('100語すべてに問題文・表示文・歌唱用読みを用意する', () => {
    expect(entries).toHaveLength(100);
    expect(new Set(entries.map((entry) => entry.word)).size).toBe(100);

    for (const entry of entries) {
      expect(entry.questionText, entry.word).toContain('○○');
      expect(entry.questionText, entry.word).not.toContain(entry.answer);
      expect(entry.displayText, entry.word).toContain(entry.answer);
      expect(entry.singingReading, entry.word).toMatch(/^[ぁ-ゖー]+$/u);
      expect(entry.explanation.length, entry.word).toBeGreaterThan(0);
    }
  });

  it('全100例文を5曲それぞれで1例文1フレーズへ割り当てる', () => {
    for (const sourceSong of memorizationSourceSongs) {
      const baseScore = readJson(path.join('assets/score', sourceSong.scoreFileName)) as MemorizationScoreJson;
      for (const entry of entries) {
        const rows = Array.from({ length: 3 }, () => [entry.displayText ?? '', entry.singingReading ?? ''] as const);
        const result = createMemorizationScore(rows, baseScore);
        expect(result.phraseRanges, `${sourceSong.title}: ${entry.word}`).toHaveLength(3);
        expect(result.phraseRanges.at(-1)?.[1], `${sourceSong.title}: ${entry.word}`)
          .toBe(result.score.notes.length);
        expect(result.phraseRanges.every(([start, end]) => end > start), `${sourceSong.title}: ${entry.word}`)
          .toBe(true);
      }
    }
  });

  it('選ばれた問題の読みだけを合成用の行にする', () => {
    const selected = entries[0];
    expect(selected).toBeDefined();
    const tasks = buildOnomatopoeiaTasks(selected!, selected!.answer, true);

    expect(buildOnomatopoeiaLyricsRows(tasks)).toEqual([
      [selected!.answer, selected!.singingReading]
    ]);
  });
});
