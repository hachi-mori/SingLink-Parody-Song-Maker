import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildOnomatopoeiaLyricsRows,
  buildMemorizationSynthesisPlan,
  buildKaraokeLineTimings,
  createMemorizationScore,
  getKaraokeLineProgress,
  type MemorizationScoreJson
} from '../src/memorizationScore';
import { memorizationSourceSongs } from '../src/memorizationSongs';
import { parseOnomatopoeiaCardEntries } from '../src/onomatopoeiaCards';
import {
  buildOnomatopoeiaTasks,
  buildOnomatopoeiaResultLyrics,
  onomatopoeiaQuestionsPerGame
} from '../src/gameLogic';

function loadJson(fileName: string): unknown {
  const text = fs.readFileSync(path.resolve(fileName), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text) as unknown;
}

function loadScore(fileName: string): MemorizationScoreJson {
  return loadJson(path.join('assets/score', fileName)) as MemorizationScoreJson;
}

function loadBaseScore(): MemorizationScoreJson {
  return loadScore('幸せなら手をたたこう.json');
}

const originalEntries = parseOnomatopoeiaCardEntries(
  loadJson('assets/dict/cards_text_data.json'),
  loadJson('assets/dict/cards_singing_readings.json')
).slice(0, 4);

function rowsFromOriginalEntries(): Array<[string, string]> {
  return originalEntries.map((entry) => [entry.displayText ?? '', entry.singingReading ?? '']);
}

function compactOnomatopoeia(text: string): string {
  return text.replace(/[っー]/g, '');
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

function expectPhraseAssignments(
  score: MemorizationScoreJson,
  phraseRanges: ReadonlyArray<readonly [number, number]>
): void {
  expect(phraseRanges).toHaveLength(originalEntries.length);
  phraseRanges.forEach(([start, end], index) => {
    const phraseLyrics = compactOnomatopoeia(score.notes.slice(start, end).map((note) => note.lyric).join(''));
    const expectedSignature = compactOnomatopoeia(originalEntries[index]?.answer ?? '');
    expect(containsInOrder(phraseLyrics, expectedSignature), originalEntries[index]?.answer).toBe(true);
  });
}

function generate() {
  return createMemorizationScore(rowsFromOriginalEntries(), loadBaseScore());
}

function expandKeys(score: MemorizationScoreJson): Array<number | null> {
  return score.notes.flatMap((note) => Array<number | null>(note.frame_length).fill(note.key));
}

describe('memorization score', () => {
  it('オノマトペクイズを1プレイ4問にする', () => {
    expect(onomatopoeiaQuestionsPerGame).toBe(4);
  });

  it('自作教材の4文を5曲すべてで4フレーズへ割り当てる', () => {
    expect(originalEntries).toHaveLength(4);
    const rows = rowsFromOriginalEntries();

    for (const sourceSong of memorizationSourceSongs) {
      const base = loadScore(sourceSong.scoreFileName);
      const result = createMemorizationScore(rows, base);
      const totalFrames = result.score.notes.reduce((sum, note) => sum + note.frame_length, 0);
      expect(result.phraseRanges, sourceSong.title).toHaveLength(4);
      expect(result.phraseRanges.at(-1)?.[1], sourceSong.title).toBe(result.score.notes.length);
      expect(result.phraseRanges.every(([start, end]) => end > start), sourceSong.title).toBe(true);
      expect(result.score.notes.at(-1)?.lyric, sourceSong.title).toMatch(/^[ぁ-ゖー]+$/u);
      expect(expandKeys(result.score), sourceSong.title).toEqual(expandKeys(base).slice(0, totalFrames));
      expectPhraseAssignments(result.score, result.phraseRanges);
    }
  });

  it('読みとフレーズ範囲を一貫して出力する', () => {
    const result = generate();

    expect(result.score.notes.length).toBeGreaterThan(0);
    expect(result.phraseRanges).toHaveLength(4);
    expect(result.phraseRanges.at(-1)?.[1]).toBe(result.score.notes.length);
    expect(rowsFromOriginalEntries().map((row) => row[1])).toEqual(
      originalEntries.map((entry) => entry.singingReading)
    );
    expect(result.score.notes.map((note) => note.lyric).join('')).toMatch(/^[ぁ-ゖー]+$/u);
    expectPhraseAssignments(result.score, result.phraseRanges);
  });

  it('必要な音符だけを出力して不要な末尾音符を残さない', () => {
    const { score, phraseRanges } = generate();

    expect(score['16thnoteframe_length']).toBe(loadBaseScore()['16thnoteframe_length']);
    expect(score.notes).toHaveLength(phraseRanges.at(-1)?.[1] ?? 0);
    expect(phraseRanges.map(([start, end]) => score.notes.slice(start, end)
      .reduce((sum, note) => sum + note.frame_length, 0)).every((frameLength) => frameLength > 0)).toBe(true);
    expect(score.notes.at(-1)?.lyric).toMatch(/^[ぁ-ゖー]+$/u);
  });

  it('音高タイムラインを維持し入力非破壊かつ決定的に生成する', () => {
    const base = loadBaseScore();
    const snapshot = structuredClone(base);
    const first = createMemorizationScore(rowsFromOriginalEntries(), base);
    const second = createMemorizationScore(rowsFromOriginalEntries(), base);
    const totalFrames = first.score.notes.reduce((sum, note) => sum + note.frame_length, 0);

    expect(base).toEqual(snapshot);
    expect(first).toEqual(second);
    expect(expandKeys(first.score)).toEqual(expandKeys(snapshot).slice(0, totalFrames));
  });

  it('正誤順から各フレーズの話者を選び歌詞は変更しない', () => {
    const { score, phraseRanges } = generate();
    const plan = buildMemorizationSynthesisPlan(score, phraseRanges, [true, false, true, false]);

    expect(plan.map((segment) => segment.speakerId)).toEqual([3003, 3076, 3003, 3076]);
    expect(plan.map((segment) => segment.leadingPaddingFrames)).toEqual([0, 2, 2, 2]);
    expect(plan.map((segment) => segment.score.notes.slice(segment.leadingPaddingFrames > 0 ? 1 : 0))).toEqual(
      phraseRanges.map(([start, end]) => score.notes.slice(start, end))
    );
    expect(plan.slice(1).map((segment) => segment.score.notes[0]))
      .toEqual(Array(3).fill({ frame_length: 2, key: null, lyric: '', notelen: 'R' }));
    expect(plan.map((segment) => segment.score.notes.reduce((sum, note) => sum + note.frame_length, 0)
      - segment.leadingPaddingFrames))
      .toEqual(phraseRanges.map(([start, end]) => score.notes.slice(start, end)
        .reduce((sum, note) => sum + note.frame_length, 0)));
    expect(plan.flatMap((segment) => segment.score.notes.slice(segment.leadingPaddingFrames > 0 ? 1 : 0))
      .map((note) => note.lyric))
      .toEqual(score.notes.map((note) => note.lyric));
  });

  it('5曲の4フレーズについて各音符のframe_lengthから93.75fpsのカラオケ時刻を導出する', () => {
    for (const sourceSong of memorizationSourceSongs) {
      const result = createMemorizationScore(rowsFromOriginalEntries(), loadScore(sourceSong.scoreFileName));
      const timings = buildKaraokeLineTimings(result.score, result.phraseRanges);
      expect(timings, sourceSong.title).toHaveLength(4);
      expect(timings[0]?.startSeconds, sourceSong.title).toBe(0);
      timings.forEach((timing, index) => {
        const expectedFrames = result.phraseRanges.slice(0, index + 1).reduce(
          (total, [start, end]) => total + result.score.notes.slice(start, end)
            .reduce((phraseTotal, note) => phraseTotal + Math.max(0, note.frame_length), 0),
          0
        );
        expect(timing.endSeconds, `${sourceSong.title} phrase ${index + 1}`)
          .toBeCloseTo(expectedFrames / 93.75, 8);
        if (index > 0) expect(timing.startSeconds).toBe(timings[index - 1]?.endSeconds);
        const [start, end] = result.phraseRanges[index] ?? [0, 0];
        const notes = result.score.notes.slice(start, end);
        expect(timing.noteTimings, `${sourceSong.title} phrase ${index + 1} notes`).toHaveLength(notes.length);
        timing.noteTimings.forEach((noteTiming, noteIndex) => {
          expect(noteTiming.endSeconds - noteTiming.startSeconds)
            .toBeCloseTo((notes[noteIndex]?.frame_length ?? 0) / 93.75, 8);
        });
      });
    }
  });

  it('歌唱音符の間だけ着色を進め、休符中は位置を止める', () => {
    const [timing] = buildKaraokeLineTimings({ notes: [
      { frame_length: 94, key: 60, lyric: 'か', notelen: '4' },
      { frame_length: 47, key: null, lyric: '', notelen: 'R' },
      { frame_length: 188, key: 62, lyric: 'な', notelen: '2' }
    ] }, [[0, 3]], 94, ['きゃく。']);

    expect(timing).toBeDefined();
    expect(timing?.noteTimings.map(({ startProgress, endProgress }) => [startProgress, endProgress]))
      .toEqual([[0, 0.5], [0.5, 0.5], [0.5, 1]]);
    expect(getKaraokeLineProgress(timing!, 0.5)).toBeCloseTo(0.25, 8);
    expect(getKaraokeLineProgress(timing!, 1.25)).toBe(0.5);
    expect(getKaraokeLineProgress(timing!, 2.5)).toBeCloseTo(0.75, 8);
  });

  it('自作教材の表示文と歌唱用読みを正誤に関係なく維持する', () => {
    const tasks = originalEntries.flatMap((entry, index) =>
      buildOnomatopoeiaTasks(entry, index === 1 ? originalEntries[0]?.answer ?? '' : entry.answer, index !== 1)
    );

    expect(buildOnomatopoeiaResultLyrics(originalEntries))
      .toBe(originalEntries.map((entry) => entry.displayText).join('\n'));
    expect(buildOnomatopoeiaLyricsRows(tasks).map((row) => row[1]))
      .toEqual(originalEntries.map((entry) => entry.singingReading));
    expect(createMemorizationScore(buildOnomatopoeiaLyricsRows(tasks), loadBaseScore()).score.notes.map((note) => note.lyric))
      .toEqual(generate().score.notes.map((note) => note.lyric));
  });
});
