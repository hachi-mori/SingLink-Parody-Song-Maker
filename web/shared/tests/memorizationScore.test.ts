import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildOnomatopoeiaLyricsRows,
  buildMemorizationSynthesisPlan,
  createMemorizationScore,
  onomatopoeiaExamples,
  type MemorizationScoreJson
} from '../src/memorizationScore';
import { buildOnomatopoeiaTasks, buildOnomatopoeiaResultLyrics } from '../src/gameLogic';

const scorePath = path.resolve('assets/score/幸せなら手をたたこう.json');

function loadBaseScore(): MemorizationScoreJson {
  const text = fs.readFileSync(scorePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text) as MemorizationScoreJson;
}

function generate() {
  return createMemorizationScore(
    onomatopoeiaExamples.map((example) => [example.displayText, example.singingReading]),
    loadBaseScore()
  );
}

function expandKeys(score: MemorizationScoreJson): Array<number | null> {
  return score.notes.flatMap((note) => Array<number | null>(note.frame_length).fill(note.key));
}

describe('memorization score', () => {
  it('指定3文をゴールデン歌詞と期待範囲へ割り当てる', () => {
    const result = generate();

    expect(result.score.notes.map((note) => note.lyric)).toEqual([
      '',
      'し', 'と', 'し', 'と', 'と', 'あ', 'め', 'が', 'ふ', 'て', 'い', 'る',
      'ぶ', 'ん', 'ぶ', 'ん', 'と', 'は', 'ち', 'が', 'と', 'ぶ', 'お', 'と', 'が', 'す', 'る',
      'わ', 'く', 'わ', 'く', 'し', 'な', 'が', 'ら', 'ぷ', 'れ', 'ぜ', 'ん', 'と', 'の', 'は', 'こ', 'を', 'あ', 'け', 'る'
    ]);
    expect(result.phraseRanges).toEqual([[0, 13], [13, 28], [28, 48]]);
    expect(result.difference).toBe(11);
  });

  it('48音符と1129 frameだけを出力して不要な末尾音符を残さない', () => {
    const { score, phraseRanges } = generate();

    expect(score['16thnoteframe_length']).toBe(loadBaseScore()['16thnoteframe_length']);
    expect(score.notes).toHaveLength(48);
    expect(score.notes.reduce((sum, note) => sum + note.frame_length, 0)).toBe(1129);
    expect(phraseRanges.map(([start, end]) => score.notes.slice(start, end)
      .reduce((sum, note) => sum + note.frame_length, 0))).toEqual([378, 375, 376]);
    expect(score.notes.at(-1)).toMatchObject({ lyric: 'る', frame_length: 47, key: 67 });
    expect(score.notes.map((note) => note.lyric).join('')).not.toMatch(/に$/);
  });

  it('音高タイムラインを維持し入力非破壊かつ決定的に生成する', () => {
    const base = loadBaseScore();
    const snapshot = structuredClone(base);
    const rows = onomatopoeiaExamples.map((example) => [example.displayText, example.singingReading] as const);
    const first = createMemorizationScore(rows, base);
    const second = createMemorizationScore(rows, base);

    expect(base).toEqual(snapshot);
    expect(first).toEqual(second);
    expect(expandKeys(first.score)).toEqual(expandKeys(snapshot).slice(0, 1129));
  });

  it('正誤順から各フレーズの話者を選び歌詞は変更しない', () => {
    const { score, phraseRanges } = generate();
    const plan = buildMemorizationSynthesisPlan(score, phraseRanges, [true, false, true]);

    expect(plan.map((segment) => segment.speakerId)).toEqual([3003, 3076, 3003]);
    expect(plan.map((segment) => segment.leadingPaddingFrames)).toEqual([0, 2, 2]);
    expect(plan.map((segment) => segment.score.notes.slice(segment.leadingPaddingFrames > 0 ? 1 : 0))).toEqual(
      phraseRanges.map(([start, end]) => score.notes.slice(start, end))
    );
    expect(plan.slice(1).map((segment) => segment.score.notes[0]))
      .toEqual(Array(2).fill({ frame_length: 2, key: null, lyric: '', notelen: 'R' }));
    expect(plan.map((segment) => segment.score.notes.reduce((sum, note) => sum + note.frame_length, 0)
      - segment.leadingPaddingFrames))
      .toEqual([378, 375, 376]);
    expect(plan.reduce((sum, segment) => sum + segment.score.notes.reduce(
      (segmentSum, note) => segmentSum + note.frame_length,
      -segment.leadingPaddingFrames
    ), 0)).toBe(1129);
    expect(plan.flatMap((segment) => segment.score.notes.slice(segment.leadingPaddingFrames > 0 ? 1 : 0))
      .map((note) => note.lyric))
      .toEqual(score.notes.map((note) => note.lyric));
  });

  it('固定順の表示文と歌唱用読みを正誤に関係なく維持する', () => {
    const tasks = onomatopoeiaExamples.flatMap((example, index) =>
      buildOnomatopoeiaTasks({ ...example }, index === 1 ? 'しとしと' : example.answer, index !== 1)
    );

    expect(buildOnomatopoeiaResultLyrics(onomatopoeiaExamples.map((example) => ({ ...example }))))
      .toBe(onomatopoeiaExamples.map((example) => example.displayText).join('\n'));
    expect(buildOnomatopoeiaLyricsRows(tasks).map((row) => row[1]))
      .toEqual(onomatopoeiaExamples.map((example) => example.singingReading));
    expect(createMemorizationScore(buildOnomatopoeiaLyricsRows(tasks), loadBaseScore()).score.notes.map((note) => note.lyric))
      .toEqual(generate().score.notes.map((note) => note.lyric));
  });
});
