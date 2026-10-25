import type { OnomatopoeiaEntry, SongDetail } from '@shared/types';
import { onomatopoeiaQuestionsPerGame } from '@shared/gameLogic';
import { shuffle, takeShuffled } from './random';

export function selectOnomatopoeiaQuestions(song: SongDetail, fixedDemoEntries?: OnomatopoeiaEntry[]): OnomatopoeiaEntry[] {
  if (song.mode !== 'onomatopoeiaQuiz') return [];
  if (fixedDemoEntries) return [...fixedDemoEntries];
  const entries = song.onomatopoeiaEntries ?? [];
  return song.experienceSet ? [...entries] : takeShuffled(entries, onomatopoeiaQuestionsPerGame);
}

export function prepareOnomatopoeiaOptions(entries: OnomatopoeiaEntry[], question: OnomatopoeiaEntry): { options: string[]; correctIndex: number } | undefined {
  if (question.choices) {
    const options = [...question.choices];
    return { options, correctIndex: options.indexOf(question.answer) };
  }
  const wrongAnswers = [...new Set(entries.map((entry) => entry.answer).filter((answer) => answer !== question.answer))];
  if (wrongAnswers.length < 2) return undefined;
  const options = shuffle([question.answer, ...takeShuffled(wrongAnswers, 2)]);
  return { options, correctIndex: options.indexOf(question.answer) };
}
