import type { KaraokeLineTiming, SolvedTask, SongMode } from '@shared/types';

export type ResultLine = {
  text: string;
  task?: SolvedTask;
  timing?: KaraokeLineTiming;
};

/** Display rows include every answer, even when it has no singing reading. */
export function buildResultLines(
  fullLyrics: string,
  tasks: SolvedTask[],
  timings: KaraokeLineTiming[],
  mode: SongMode
): ResultLine[] {
  // Live onomatopoeia rounds contain an empty-phrase lead-in task before
  // each answer; demo rounds already contain one answer task per row.
  const displayTasks = mode === 'onomatopoeiaQuiz'
    ? tasks.filter((task) => task.phrase.length > 0)
    : tasks;
  const timingByTask = new Map<SolvedTask, KaraokeLineTiming>();
  let singingIndex = 0;
  for (const task of tasks) {
    if (!task.singingReading) continue;
    const timing = timings[singingIndex++];
    if (timing) timingByTask.set(task, timing);
  }
  return fullLyrics.replace(/[{}]/g, '').split('\n').filter(Boolean).map((text, index) => {
    const task = displayTasks[index];
    return { text, task, timing: task ? timingByTask.get(task) : undefined };
  });
}
