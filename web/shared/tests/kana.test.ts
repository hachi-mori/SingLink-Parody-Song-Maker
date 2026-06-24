import { describe, expect, it } from 'vitest';
import { buildOnomatopoeiaResultLyrics, buildOnomatopoeiaTasks } from '../src/gameLogic';
import { getVowel, replaceChoonWithVowel, splitOnomatopoeiaMoras, splitSyllables } from '../src/kana';
import { parseOnomatopoeiaCardEntries } from '../src/onomatopoeiaCards';

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

  it('カードJSONから穴埋めオノマトペ問題を作る', () => {
    const entries = parseOnomatopoeiaCardEntries({
      records: [{
        onomatopoeia: 'あつあつ',
        usages: [{ text: 'あつあつのおでんはおいしいなあ。' }],
        meanings: [{ text: '料理などができたてであついようす。' }]
      }]
    });

    expect(entries[0]).toMatchObject({
      word: 'あつあつ',
      reading: 'あつあつ',
      answer: 'あつあつ',
      explanation: '料理などができたてであついようす。',
      questionText: '○○のおでんはおいしいなあ。'
    });
  });

  it('オノマトペのリザルト歌詞は正解で穴埋めする', () => {
    const problem = {
      word: 'るんるん',
      reading: 'るんるん',
      answer: 'るんるん',
      explanation: '',
      questionText: '大きな犬が急に出てきて、○○する。'
    };

    expect(buildOnomatopoeiaResultLyrics([problem])).toContain('大きな犬が急に出てきてるんるんする');

    const [, answerTask] = buildOnomatopoeiaTasks(problem, 'よたよた', false);
    expect(answerTask).toMatchObject({
      phrase: 'るんるん',
      userInput: 'よたよた',
      userSyllables: ['る', 'ん', 'る', 'ん'],
      isCorrect: false
    });
  });
});
