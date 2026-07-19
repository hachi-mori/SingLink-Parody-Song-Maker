import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildKaraokeLineTimings, createMemorizationScore, voicevoxFrameRate } from '../src/memorizationScore';

type WavInfo = { durationSeconds: number; sampleRate: number };

function readWavInfo(buffer: Buffer): WavInfo {
  expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
  let offset = 12;
  let sampleRate = 0;
  let byteRate = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      sampleRate = buffer.readUInt32LE(offset + 12);
      byteRate = buffer.readUInt32LE(offset + 16);
    }
    if (id === 'data') dataSize += size;
    offset += 8 + size + (size % 2);
  }
  expect(sampleRate).toBe(44_100);
  expect(byteRate).toBeGreaterThan(0);
  expect(dataSize).toBeGreaterThan(0);
  return { sampleRate, durationSeconds: dataSize / byteRate };
}

describe('fixed quiz demo assets', () => {
  it('uses the existing 幸せなら手をたたこう score and accompaniment for four fixed lines', async () => {
    const demoRoot = path.resolve('assets/demo');
    const manifest = JSON.parse(await readFile(path.join(demoRoot, 'manifest.json'), 'utf8')) as {
      disclosure: { ja: string; en: string };
      sourceSong: { id: string; title: string; scorePath: string; accompanimentPath: string };
      voice: { path: string; credit: string };
      accompaniment: { path: string; credit: string };
      lines: Array<{ japanese: string; singingReading: string; keyword: string; englishExample: string; englishMeaning: string }>;
      karaokeTimings: Array<{ startSeconds: number; endSeconds: number; noteTimings: unknown[] }>;
    };
    expect(manifest.lines).toHaveLength(4);
    expect(manifest.karaokeTimings).toHaveLength(manifest.lines.length);
    expect(manifest.disclosure.en).toContain('pre-generated demo sample');
    expect(manifest.disclosure.ja).toContain('事前生成したデモサンプル');
    expect(manifest.voice.credit).toBe('VOICEVOX:ずんだもん');
    expect(manifest.sourceSong).toEqual({
      id: 'shiawase-nara-tewo-tatakou',
      title: '幸せなら手をたたこう',
      scorePath: 'assets/score/幸せなら手をたたこう.json',
      accompanimentPath: 'assets/inst/幸せなら手をたたこう.wav'
    });
    expect(manifest.accompaniment.path).toBe(manifest.sourceSong.accompanimentPath);
    expect(manifest.accompaniment.credit).toContain('幸せなら手をたたこう');
    expect(manifest.lines.map((line) => line.keyword)).toEqual(['きらきら', 'しとしと', 'すやすや', 'りんりん']);
    expect(manifest.lines.map((line) => line.japanese).join('\n')).toBe([
      '朝日がきらきら光ります',
      '雨がしとしと降っています',
      '猫がすやすや眠っています',
      '鐘がりんりん鳴っています'
    ].join('\n'));

    const scoreText = await readFile(path.resolve(manifest.sourceSong.scorePath), 'utf8');
    const sourceScore = JSON.parse(scoreText.replace(/^\uFEFF/, ''));
    const generated = createMemorizationScore(
      manifest.lines.map((line) => [line.japanese, line.singingReading]),
      sourceScore
    );
    expect(generated.phraseRanges).toHaveLength(manifest.lines.length);
    expect(manifest.karaokeTimings).toEqual(buildKaraokeLineTimings(
      generated.score,
      generated.phraseRanges,
      voicevoxFrameRate,
      manifest.lines.map((line) => line.japanese)
    ));

    let previousEnd = 0;
    for (const [index, timing] of manifest.karaokeTimings.entries()) {
      const line = manifest.lines[index];
      expect(line).toBeDefined();
      if (!line) throw new Error(`Missing demo line ${index}`);
      expect(line.japanese.length).toBeGreaterThan(0);
      expect(line.englishExample.length).toBeGreaterThan(0);
      expect(line.englishMeaning.length).toBeGreaterThan(0);
      expect(line.japanese).toContain(line.keyword);
      expect(line.japanese.replace(line.keyword, '○○')).toContain('○○');
      expect(timing.startSeconds).toBeGreaterThanOrEqual(previousEnd);
      expect(timing.endSeconds).toBeGreaterThan(timing.startSeconds);
      expect(timing.noteTimings.length).toBeGreaterThan(0);
      previousEnd = timing.endSeconds;
    }

    const [voice, accompaniment] = await Promise.all([
      readFile(path.resolve('assets', manifest.voice.path.replace(/^assets\//, ''))),
      readFile(path.resolve('assets', manifest.accompaniment.path.replace(/^assets\//, '')))
    ]);
    const voiceInfo = readWavInfo(voice);
    const accompanimentInfo = readWavInfo(accompaniment);
    expect(voiceInfo.durationSeconds).toBeGreaterThan(previousEnd - 0.06);
    expect(accompanimentInfo.durationSeconds).toBeGreaterThan(previousEnd - 0.06);
    expect(Math.abs(voiceInfo.durationSeconds - accompanimentInfo.durationSeconds)).toBeLessThan(0.06);
  });
});
