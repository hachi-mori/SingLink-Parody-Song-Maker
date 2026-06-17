import { describe, expect, it } from 'vitest';
import {
  applyParodyLyrics,
  buildResultDisplayLyrics,
  buildTalkProblems,
  convertVVProjToScoreJSON,
  extractTalkUtterances,
  parseTargetText
} from '../src/vvproj';
import type { SolvedTask } from '../src/types';

function makeVvproj() {
  return {
    talk: {
      audioKeys: ['a', 'b'],
      audioItems: {
        a: { text: 'さかな[が]' },
        b: { text: 'おさかなは？' }
      }
    },
    song: {
      tpqn: 480,
      tempos: [{ bpm: 120 }],
      trackOrder: ['track1'],
      tracks: {
        track1: {
          name: 'テスト曲',
          notes: [
            { position: 0, duration: 480, noteNumber: 60, lyric: 'さ', notelen: 'C4' },
            { position: 480, duration: 480, noteNumber: 62, lyric: 'か', notelen: 'D4' },
            { position: 960, duration: 480, noteNumber: 64, lyric: 'な', notelen: 'E4' },
            { position: 1440, duration: 480, noteNumber: 65, lyric: 'が', notelen: 'F4' }
          ]
        }
      }
    }
  };
}

describe('vvproj utilities', () => {
  it('talkから問題を組み立てる', () => {
    const lines = extractTalkUtterances(makeVvproj());
    expect(lines).toEqual(['さかな[が]', 'おさかなは？']);
    expect(parseTargetText('さかな[が]')).toEqual({ baseText: 'さかなが', particleText: 'が' });
    expect(buildTalkProblems(lines)[0]).toMatchObject({
      baseTargetText: 'さかなが',
      particleText: 'が',
      questionText: 'おさかなは？',
      targetSyllables: ['さ', 'か', 'な', 'が']
    });
  });

  it('歌詞置換と表示歌詞生成を行う', () => {
    const task: SolvedTask = {
      phrase: 'さかなが',
      syllables: ['さ', 'か', 'な', 'が'],
      userInput: 'まぐろ',
      userSyllables: ['ま', 'ぐ', 'ろ', 'が']
    };
    const modified = applyParodyLyrics(makeVvproj(), [task]) as ReturnType<typeof makeVvproj>;
    expect(modified.song.tracks.track1.notes.map((note) => note.lyric)).toEqual(['ま', 'ぐ', 'ろ', 'が']);
    expect(buildResultDisplayLyrics(makeVvproj(), [task])).toBe('まぐろが');
  });

  it('vvprojをVOICEVOX score jsonに変換する', () => {
    const score = convertVVProjToScoreJSON(makeVvproj());
    expect(score.notes[0]).toMatchObject({ notelen: 'R' });
    expect(score.notes.some((note) => note.lyric === 'さ' && note.key === 60)).toBe(true);
  });
});
