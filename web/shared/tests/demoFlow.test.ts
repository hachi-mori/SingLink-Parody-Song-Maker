import { describe, expect, it } from 'vitest';
import type { OnomatopoeiaEntry, SolvedTask } from '../src/types';
import type { GeneratedResult } from '../../client/src/lib/generatedResult';
import {
  completeFixedDemo,
  getFixedDemoQuestions,
  shouldCheckVoicevoxOnInitialLoad,
  type DemoFlowData
} from '../../client/src/lib/demoFlow';

const questions: OnomatopoeiaEntry[] = [
  { word: 'きらきら', reading: 'きらきら', answer: 'きらきら', explanation: '', questionText: '朝日が○○光ります' },
  { word: 'しとしと', reading: 'しとしと', answer: 'しとしと', explanation: '', questionText: '雨が○○降っています' },
  { word: 'すやすや', reading: 'すやすや', answer: 'すやすや', explanation: '', questionText: '猫が○○眠っています' },
  { word: 'りんりん', reading: 'りんりん', answer: 'りんりん', explanation: '', questionText: '鐘が○○鳴っています' }
];

const canonicalTasks: SolvedTask[] = questions.map((question) => ({
  phrase: question.answer,
  syllables: [],
  userInput: question.answer,
  userSyllables: [],
  isCorrect: true
}));

const canonicalResult: GeneratedResult = {
  status: 'generated',
  source: 'demo',
  blob: new Blob(),
  blobUrl: 'https://example.test/demo.wav',
  fileName: 'demo.wav',
  karaokeTimings: []
};

const demo: DemoFlowData = {
  questions,
  tasks: canonicalTasks,
  fullLyrics: '朝日がきらきら光ります\n雨がしとしと降っています\n猫がすやすや眠っています\n鐘がりんりん鳴っています',
  result: canonicalResult
};

describe('固定問題デモフロー', () => {
  it('デモ直リンクだけ初期VOICEVOX確認を省略する', () => {
    expect(shouldCheckVoicevoxOnInitialLoad('')).toBe(true);
    expect(shouldCheckVoicevoxOnInitialLoad('?mode=normal')).toBe(true);
    expect(shouldCheckVoicevoxOnInitialLoad('?demo=1')).toBe(false);
  });

  it('固定問題をmanifest順のまま返し、shuffleしない', () => {
    expect(getFixedDemoQuestions(demo)).toBe(questions);
    expect(getFixedDemoQuestions(demo).map((question) => question.answer))
      .toEqual(['きらきら', 'しとしと', 'すやすや', 'りんりん']);
  });

  it('どの回答内容でも固定の全問正解結果へ直接進む', () => {
    const completion = completeFixedDemo(demo, ['りんりん', 'すやすや', 'しとしと', 'きらきら']);

    expect(completion.nextScreen).toBe('result');
    expect(completion.inputTexts).toEqual(['りんりん', 'すやすや', 'しとしと', 'きらきら']);
    expect(completion.tasks).toBe(canonicalTasks);
    expect(completion.tasks.every((task) => task.isCorrect)).toBe(true);
    expect(completion.fullLyrics).toBe(demo.fullLyrics);
    expect(completion.result).toBe(canonicalResult);
  });
});
