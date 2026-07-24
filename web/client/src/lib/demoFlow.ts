import type { OnomatopoeiaEntry, SolvedTask } from '@shared/types';
import type { DemoBundle } from './demo';
import type { GeneratedResult } from './generatedResult';

export type DemoFlowData = Pick<DemoBundle, 'questions' | 'tasks' | 'fullLyrics' | 'result'>;

export type DemoCompletion = {
  tasks: SolvedTask[];
  fullLyrics: string;
  inputTexts: string[];
  result: GeneratedResult;
  nextScreen: 'result';
};

export function shouldCheckVoicevoxOnInitialLoad(search: string): boolean {
  return new URLSearchParams(search).get('demo') !== '1';
}

export function getFixedDemoQuestions(demo: DemoFlowData): OnomatopoeiaEntry[] {
  return demo.questions;
}

export function completeFixedDemo(demo: DemoFlowData, inputTexts: string[]): DemoCompletion {
  return {
    tasks: demo.tasks,
    fullLyrics: demo.fullLyrics,
    inputTexts,
    result: demo.result,
    nextScreen: 'result'
  };
}
