import { describe, expect, it } from 'vitest';
import { calculateWavTrimSampleFrames, trimWavLeadingFrames } from '../src/wav';

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

function makeStereoPcmWav(sampleFrames: number): Uint8Array {
  const blockAlign = 4;
  const dataSize = sampleFrames * blockAlign;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, 'RIFF');
  view.setUint32(4, bytes.length - 8, true);
  writeAscii(bytes, 8, 'WAVE');
  writeAscii(bytes, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, 44_100, true);
  view.setUint32(28, 44_100 * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, 'data');
  view.setUint32(40, dataSize, true);
  for (let index = 0; index < sampleFrames; index += 1) {
    view.setInt16(44 + index * blockAlign, index, true);
    view.setInt16(46 + index * blockAlign, -index, true);
  }
  return bytes;
}

describe('WAV utilities', () => {
  it('累積frame位置からサンプル数を丸めて誤差を持ち越さない', () => {
    const first = calculateWavTrimSampleFrames(1, 44_100, 0);
    const second = calculateWavTrimSampleFrames(1, 44_100, 1);

    expect([first, second]).toEqual([470, 471]);
    expect(first + second).toBe(Math.round(2 * 44_100 / 93.75));
  });

  it('先頭PCMを除去してRIFFとdataサイズを更新する', () => {
    const source = makeStereoPcmWav(2_000);
    const trimmed = trimWavLeadingFrames(source, 2);
    const view = new DataView(trimmed.buffer, trimmed.byteOffset, trimmed.byteLength);
    const removedSamples = Math.round(2 * 44_100 / 93.75);
    const remainingSamples = 2_000 - removedSamples;

    expect(removedSamples).toBe(941);
    expect(trimmed.byteLength).toBe(44 + remainingSamples * 4);
    expect(view.getUint32(4, true)).toBe(trimmed.byteLength - 8);
    expect(view.getUint32(40, true)).toBe(remainingSamples * 4);
    expect(view.getInt16(44, true)).toBe(removedSamples);
    expect(view.getInt16(46, true)).toBe(-removedSamples);
  });
});
