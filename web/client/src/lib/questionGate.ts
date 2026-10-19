export type QuestionSettlement<T extends object> = Readonly<{
  value: Readonly<T>;
  settledAt: number;
}>;

/** Synchronous, per-question locking. React state updates alone cannot prevent
 * a second input or timeout callback before the next render. */
export function createQuestionGate<T extends object>() {
  const settlements = new Map<number, QuestionSettlement<T>>();
  const consumed = new Set<number>();

  return {
    get(questionIndex: number): QuestionSettlement<T> | undefined {
      return settlements.get(questionIndex);
    },
    settle(questionIndex: number, value: T, settledAt: number): QuestionSettlement<T> | undefined {
      if (settlements.has(questionIndex)) return undefined;
      const settlement = Object.freeze({ value: Object.freeze({ ...value }), settledAt });
      settlements.set(questionIndex, settlement);
      return settlement;
    },
    consume(questionIndex: number): QuestionSettlement<T> | undefined {
      const settlement = settlements.get(questionIndex);
      if (!settlement || consumed.has(questionIndex)) return undefined;
      consumed.add(questionIndex);
      return settlement;
    }
  };
}
