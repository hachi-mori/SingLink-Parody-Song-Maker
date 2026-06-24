import {
  getVowel,
  isHiraganaOnly,
  makePlaceholderSyllables,
  replaceChoonWithVowel,
  splitOnomatopoeiaMoras,
  splitSyllables,
  vowelToKana
} from './kana';
import type { OnomatopoeiaEntry, SolvedTask, TalkProblem, VerbEntry } from './types';

export type SubmitAnswerResult =
  | { ok: true; task: SolvedTask }
  | { ok: false; message: string };

export function makeQuestionDisplayText(index: number, questionText: string): string {
  const circledNumbers = [
    '①',
    '②',
    '③',
    '④',
    '⑤',
    '⑥',
    '⑦',
    '⑧',
    '⑨',
    '⑩',
    '⑪',
    '⑫',
    '⑬',
    '⑭',
    '⑮',
    '⑯',
    '⑰',
    '⑱',
    '⑲',
    '⑳'
  ];
  return `${circledNumbers[index] ?? `${index + 1}`} ${questionText}`;
}

export function validateAndBuildSolvedTask(problem: TalkProblem, displayText: string, readingText = displayText): SubmitAnswerResult {
  const maxSyllables = Math.max(2, problem.maxSyllableCount);
  if (!isHiraganaOnly(readingText)) {
    return { ok: false, message: 'ひらがなのみで入力してください' };
  }
  if (readingText.startsWith('ー')) {
    return { ok: false, message: '言葉の先頭を「ー」から始めることはできません' };
  }
  if (readingText.includes('っ')) {
    return { ok: false, message: '「っ」を入力することはできません' };
  }

  const normalizedText = replaceChoonWithVowel(readingText);
  const inputSyllables = splitSyllables(normalizedText);
  const inputCount = inputSyllables.length;

  if (inputCount < 2 || inputCount > maxSyllables) {
    return {
      ok: false,
      message: `${2}〜${maxSyllables} 音節で入力してください（いま ${inputCount} 音節）`
    };
  }

  let finalText = normalizedText;
  const finalSyllables = [...inputSyllables];

  if (inputCount < maxSyllables) {
    const remainingSlots = maxSyllables - inputCount;
    const particleSyllables = splitSyllables(problem.particleText);
    const canAppendParticle = problem.particleText.length > 0 && particleSyllables.length > 0 && particleSyllables.length <= remainingSlots;
    const vowelKana = vowelToKana(getVowel(inputSyllables.at(-1) ?? ''));

    const appendVowelFills = (fillCount: number) => {
      for (let i = 0; i < fillCount; i += 1) {
        finalText += vowelKana;
        finalSyllables.push(vowelKana);
      }
    };

    if (canAppendParticle) {
      appendVowelFills(remainingSlots - particleSyllables.length);
      finalText += problem.particleText;
      finalSyllables.push(...particleSyllables);
    } else {
      appendVowelFills(remainingSlots);
    }
  }

  return {
    ok: true,
    task: {
      phrase: problem.baseTargetText,
      syllables: problem.targetSyllables,
      userInput: displayText,
      userSyllables: finalSyllables,
      score: 0,
      rhymeMatchPercent: 0,
      matchesCount: 0,
      isCorrect: true
    }
  };
}

export function makeTimedOutTask(problem: TalkProblem): SolvedTask {
  const maxSyllables = Math.max(2, problem.maxSyllableCount);
  const autoAnswer = 'ら'.repeat(maxSyllables);
  return {
    phrase: problem.baseTargetText,
    syllables: problem.targetSyllables,
    userInput: autoAnswer,
    userSyllables: splitSyllables(autoAnswer),
    score: 0,
    rhymeMatchPercent: 0,
    matchesCount: 0,
    isCorrect: false
  };
}

export function parseQuestionVerbGroup(questionText: string): string | undefined {
  if (questionText.includes('Ⅰ') || questionText.includes('1') || questionText.includes('一')) {
    return '動詞1類';
  }
  if (questionText.includes('Ⅱ') || questionText.includes('2') || questionText.includes('二')) {
    return '動詞2類';
  }
  if (questionText.includes('Ⅲ') || questionText.includes('3') || questionText.includes('三')) {
    return '動詞3類';
  }
  return undefined;
}

export function findVerbEntries(entries: VerbEntry[], group: string, maxSyllables: number, sameGroup: boolean): VerbEntry[] {
  const moraLimit = Math.min(maxSyllables, 4);
  return entries.filter((entry) => {
    if ((entry.group === group) !== sameGroup) {
      return false;
    }
    const syllableCount = splitSyllables(replaceChoonWithVowel(entry.reading)).length;
    return 2 <= syllableCount && syllableCount <= moraLimit;
  });
}

export function buildVerbSolvedTask(problem: TalkProblem, entry: VerbEntry): SubmitAnswerResult {
  return validateAndBuildSolvedTask(problem, entry.word, entry.reading);
}

export function buildOnomatopoeiaTasks(problem: OnomatopoeiaEntry, answer: string, isCorrect: boolean): SolvedTask[] {
  return [
    {
      phrase: '',
      syllables: makePlaceholderSyllables('ラ', 8),
      userInput: problem.word,
      userSyllables: splitOnomatopoeiaMoras(replaceChoonWithVowel(problem.reading)),
      restPadding: true,
      score: 0,
      rhymeMatchPercent: 0,
      matchesCount: 0,
      isCorrect: true
    },
    {
      phrase: problem.answer,
      syllables: makePlaceholderSyllables('ル', 6),
      userInput: answer,
      userSyllables: splitOnomatopoeiaMoras(replaceChoonWithVowel(problem.answer)),
      restPadding: true,
      score: 0,
      rhymeMatchPercent: 0,
      matchesCount: 0,
      isCorrect
    }
  ];
}

function cleanResultLyricLine(line: string): string {
  return line.replace(/[。、]/g, '');
}

export function buildOnomatopoeiaResultLyrics(problems: OnomatopoeiaEntry[]): string {
  const lines = problems.map((problem) => {
    if (problem.questionText) {
      return cleanResultLyricLine(problem.questionText.replace('○○', problem.answer));
    }
    return cleanResultLyricLine(`${problem.word}　${problem.answer}`);
  });
  return `${lines.join('\n')}\nにほんごのおのまとぺ\nうたってたくさんべんきょー`;
}
