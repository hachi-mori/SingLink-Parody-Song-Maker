import { describe, expect, it } from 'vitest';
import { createQuestionGate } from '../src/lib/questionGate';
import { buildOnomatopoeiaTasks } from '../../shared/src/gameLogic';

type Answer = { answerForRecord: string; correct: boolean; timeUp: boolean };
const wrong: Answer = { answerForRecord: '架空の誤答', correct: false, timeUp: false };
const correct: Answer = { answerForRecord: 'きらきら', correct: true, timeUp: false };

describe('one answer and one advance per quiz question', () => {
  it('keeps the first answer when a second choice fires before a React render', () => {
    const gate = createQuestionGate<Answer>();
    gate.settle(0, wrong, 1500);
    expect(gate.settle(0, correct, 1501)).toBeUndefined();
    const recorded = gate.consume(0)!;
    expect(recorded.value).toEqual(wrong);
    const tasks = buildOnomatopoeiaTasks({ word: 'きらきら', reading: 'きらきら', answer: 'きらきら', explanation: '合成データ' }, recorded.value.answerForRecord, recorded.value.correct);
    expect(tasks[1]).toMatchObject({ userInput: wrong.answerForRecord, isCorrect: false });
  });

  it('does not overwrite a timeout with a late correct answer', () => {
    const gate = createQuestionGate<Answer>();
    const timeout = { answerForRecord: 'らららららら', correct: false, timeUp: true };
    gate.settle(0, timeout, 60000);
    expect(gate.settle(0, correct, 60001)).toBeUndefined();
    expect(gate.consume(0)?.value).toEqual(timeout);
  });

  it('does not overwrite a timely answer with a queued timeout, and freezes the timer instant', () => {
    const gate = createQuestionGate<Answer>();
    gate.settle(0, correct, 59999);
    expect(gate.settle(0, { ...wrong, timeUp: true }, 60000)).toBeUndefined();
    expect(gate.get(0)).toEqual({ value: correct, settledAt: 59999 });
  });

  it('consumes Next once even when click or Enter events arrive repeatedly', () => {
    const gate = createQuestionGate<Answer>();
    expect(gate.consume(0)).toBeUndefined();
    gate.settle(0, correct, 1000);
    expect(gate.consume(0)?.value).toEqual(correct);
    expect(gate.consume(0)).toBeUndefined();
    expect(gate.consume(0)).toBeUndefined();
  });

  it('accepts a new question while rejecting stale handlers for the previous question', () => {
    const gate = createQuestionGate<Answer>();
    gate.settle(0, wrong, 1000);
    gate.consume(0);
    gate.settle(1, correct, 2000);
    expect(gate.settle(0, correct, 2001)).toBeUndefined();
    expect(gate.consume(0)).toBeUndefined();
    expect(gate.consume(1)?.value).toEqual(correct);
    expect(gate.get(0)?.value).toEqual(wrong);
  });

  it('copies and freezes the accepted record so caller mutation cannot change the saved answer', () => {
    const gate = createQuestionGate<Answer>();
    const input = { ...wrong };
    const accepted = gate.settle(0, input, 1000)!;
    input.correct = true;
    input.answerForRecord = correct.answerForRecord;
    expect(accepted.value).toEqual(wrong);
    expect(Object.isFrozen(accepted.value)).toBe(true);
    expect(Object.isFrozen(accepted)).toBe(true);
  });
});
