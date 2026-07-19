import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

describe('instant demo assets', () => {
  it('keeps four original learning lines and timings aligned with both WAV files', async () => {
    const demoRoot = path.resolve('assets/demo');
    const manifest = JSON.parse(await readFile(path.join(demoRoot, 'manifest.json'), 'utf8')) as {
      disclosure: { ja: string; en: string };
      voice: { path: string; credit: string };
      accompaniment: { path: string; credit: string };
      lines: Array<{ japanese: string; keyword: string; englishExample: string; englishMeaning: string }>;
      karaokeTimings: Array<{ startSeconds: number; endSeconds: number; noteTimings: unknown[] }>;
    };
    expect(manifest.lines).toHaveLength(4);
    expect(manifest.karaokeTimings).toHaveLength(manifest.lines.length);
    expect(manifest.disclosure.en).toContain('pre-generated demo sample');
    expect(manifest.disclosure.ja).toContain('事前生成したデモサンプル');
    expect(manifest.voice.credit).toBe('VOICEVOX:ずんだもん');
    expect(manifest.accompaniment.credit).toContain('Original melody');
    expect(manifest.lines.map((line) => line.keyword)).toEqual(['きらきら', 'しとしと', 'すやすや', 'りんりん']);
    expect(manifest.lines.map((line) => line.japanese).join('\n')).toBe([
      '朝日がきらきら光ります',
      '雨がしとしと降っています',
      '猫がすやすや眠っています',
      '鐘がりんりん鳴っています'
    ].join('\n'));

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
    expect(voiceInfo.durationSeconds).toBeGreaterThan(previousEnd);
    expect(accompanimentInfo.durationSeconds).toBeGreaterThan(previousEnd);
    expect(Math.abs(voiceInfo.durationSeconds - accompanimentInfo.durationSeconds)).toBeLessThan(0.05);
  });
});
