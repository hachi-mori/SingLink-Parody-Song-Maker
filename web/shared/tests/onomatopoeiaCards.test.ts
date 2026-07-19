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
const expectedWords = [
  'あたふた', 'あっさり', 'あやふや', 'いそいそ', 'いらいら', 'うきうき', 'うじゃうじゃ', 'うだうだ', 'うっかり', 'うっすら',
  'うっとり', 'うつらうつら', 'うとうと', 'うろうろ', 'うんざり', 'うんと', 'おいおい', 'おずおず', 'おそるおそる', 'おっとり',
  'かさかさ', 'がさがさ', 'かたかた', 'がたがた', 'かちかち', 'がちゃがちゃ', 'がつがつ', 'がっかり', 'がっくり', 'がっちり',
  'かっと', 'がみがみ', 'からから', 'からっと', 'がらりと', 'かりかり', 'がりがり', 'かんかん', 'がんがん', 'ぎくしゃく',
  'ぎざぎざ', 'ぎすぎす', 'きちんと', 'ぎっしり', 'きっちり', 'きっと', 'きっぱり', 'きびきび', 'ぎゅっと', 'ぎょっと',
  'きょろきょろ', 'きらきら', 'ぎらぎら', 'ぎりぎり', 'ぐいぐい', 'ぐうぐう', 'くしゃくしゃ', 'ぐしゃぐしゃ', 'くすくす', 'くたくた',
  'ぐちゃぐちゃ', 'くっきり', 'ぐつぐつ', 'ぐっすり', 'ぐったり', 'ぐっと', 'くよくよ', 'ぐらぐら', 'くりくり', 'くるくる',
  'ぐるぐる', 'くるり', 'ぐんぐん', 'ぐんと', 'げっそり', 'げらげら', 'けろっと', 'げんなり', 'ごくごく', 'ごしごし',
  'こそこそ', 'ごそごそ', 'ごたごた', 'ごちゃごちゃ', 'こつこつ', 'ごつごつ', 'こっそり', 'ごっちゃ', 'こってり', 'ことこと',
  'ころころ', 'ごろごろ', 'ごわごわ', 'こんがり', 'こんこん', 'こんもり', 'さくさく', 'ざっくばらん', 'ざっくり', 'さっさと'
] as const;

function getRecord(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf('object');
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

function containsInOrder(text: string, expected: string): boolean {
  let expectedIndex = 0;
  for (const character of text) {
    if (character === expected[expectedIndex]) {
      expectedIndex += 1;
    }
  }
  return expectedIndex === expected.length;
}

describe('100語のオノマトペカード', () => {
  it('許可済みCSVの第3列先頭100件を順番どおり使い、自作教材の必須項目をそろえる', () => {
    const cardsRoot = getRecord(cardsJson);
    const readingsRoot = getRecord(readingsJson);
    const records = cardsRoot.records;
    const readings = getRecord(readingsRoot.readings);

    expect(cardsRoot.record_count).toBe(100);
    expect(cardsRoot.provenance).toMatchObject({
      vocabulary: 'ユーザー提供CSVの第3列のみ',
      selection: '先頭100件を元の順番で採用',
      normalization: 'カタカナをひらがなへ機械変換'
    });
    expect(readingsRoot.record_count).toBe(100);
    expect(Array.isArray(records)).toBe(true);
    expect(records).toHaveLength(100);

    const words = (records as unknown[]).map((rawRecord, index) => {
      const record = getRecord(rawRecord);
      const word = record.onomatopoeia;
      const usages = record.usages;
      const meanings = record.meanings;
      expect(record.number).toBe(index + 1);
      expect(word).toBe(expectedWords[index]);
      expect(Array.isArray(usages)).toBe(true);
      expect(Array.isArray(meanings)).toBe(true);
      const usage = getRecord((usages as unknown[])[0]);
      const meaning = getRecord((meanings as unknown[])[0]);
      expect(usage.text).toEqual(expect.stringContaining(word as string));
      expect(meaning.text).toEqual(expect.any(String));
      expect((meaning.text as string).length).toBeGreaterThan(0);
      return word;
    });

    expect(words).toEqual(expectedWords);
    expect(new Set(words).size).toBe(100);
    expect(Object.keys(readings)).toEqual(expectedWords);
    for (const word of expectedWords) {
      expect(readings[word]).toEqual(expect.stringMatching(/^[ぁ-ゖー]+$/u));
      expect(readings[word]).toEqual(expect.stringContaining(word));
    }
  });

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
        const expectedSignature = entry.answer.replace(/[っー]/g, '');
        for (const [start, end] of result.phraseRanges) {
          const phraseLyrics = result.score.notes.slice(start, end).map((note) => note.lyric).join('').replace(/[っー]/g, '');
          expect(containsInOrder(phraseLyrics, expectedSignature), `${sourceSong.title}: ${entry.word}`).toBe(true);
        }
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
