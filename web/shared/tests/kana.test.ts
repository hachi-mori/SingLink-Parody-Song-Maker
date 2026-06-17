import { describe, expect, it } from 'vitest';
import { getVowel, replaceChoonWithVowel, splitOnomatopoeiaMoras, splitSyllables } from '../src/kana';

describe('kana utilities', () => {
  it('拗音と促音を含む音節に分割する', () => {
    expect(splitSyllables('きゃらめる')).toEqual(['きゃ', 'ら', 'め', 'る']);
    expect(splitSyllables('まっちゃ')).toEqual(['まっ', 'ちゃ']);
  });

  it('オノマトペ用は促音を独立したモーラとして扱う', () => {
    expect(splitOnomatopoeiaMoras('どきっ')).toEqual(['ど', 'き', 'っ']);
  });

  it('長音を直前の母音に変換する', () => {
    expect(replaceChoonWithVowel('らーめん')).toBe('らアめん');
    expect(replaceChoonWithVowel('きゅーと')).toBe('きゅウと');
  });

  it('母音を推定する', () => {
    expect(getVowel('きゃ')).toBe('a');
    expect(getVowel('ん')).toBe('N');
    expect(getVowel('っ')).toBe('Q');
  });
});
