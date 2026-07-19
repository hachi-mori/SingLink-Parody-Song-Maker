import type { SolvedTask } from './types';
import type { ScoreJson, ScoreNote } from './vvproj';

const smallKana = 'ぁぃぅぇぉゃゅょァィゥェォャュョ';
const normalSpeakerId = 3003;
const incorrectSpeakerId = 3076;

const vowelMap: Record<string, string> = {
  あ: 'あ', い: 'い', う: 'う', え: 'え', お: 'お',
  ア: 'ア', イ: 'イ', ウ: 'ウ', エ: 'エ', オ: 'オ',
  か: 'あ', き: 'い', く: 'う', け: 'え', こ: 'お',
  カ: 'ア', キ: 'イ', ク: 'ウ', ケ: 'エ', コ: 'オ',
  きゃ: 'あ', きゅ: 'う', きょ: 'お', キャ: 'ア', キュ: 'ウ', キョ: 'オ',
  さ: 'あ', し: 'い', す: 'う', せ: 'え', そ: 'お',
  サ: 'ア', シ: 'イ', ス: 'ウ', セ: 'エ', ソ: 'オ',
  しゃ: 'あ', しゅ: 'う', しょ: 'お', シャ: 'ア', シュ: 'ウ', ショ: 'オ',
  た: 'あ', ち: 'い', つ: 'う', て: 'え', と: 'お',
  タ: 'ア', チ: 'イ', ツ: 'ウ', テ: 'エ', ト: 'オ',
  ちゃ: 'あ', ちゅ: 'う', ちょ: 'お', チャ: 'ア', チュ: 'ウ', チョ: 'オ',
  な: 'あ', に: 'い', ぬ: 'う', ね: 'え', の: 'お',
  ナ: 'ア', ニ: 'イ', ヌ: 'ウ', ネ: 'エ', ノ: 'オ',
  にゃ: 'あ', にゅ: 'う', にょ: 'お', ニャ: 'ア', ニュ: 'ウ', ニョ: 'オ',
  は: 'あ', ひ: 'い', ふ: 'う', へ: 'え', ほ: 'お',
  ハ: 'ア', ヒ: 'イ', フ: 'ウ', ヘ: 'エ', ホ: 'オ',
  ひゃ: 'あ', ひゅ: 'う', ひょ: 'お', ヒャ: 'ア', ヒュ: 'ウ', ヒョ: 'オ',
  ま: 'あ', み: 'い', む: 'う', め: 'え', も: 'お',
  マ: 'ア', ミ: 'イ', ム: 'ウ', メ: 'エ', モ: 'オ',
  みゃ: 'あ', みゅ: 'う', みょ: 'お', ミャ: 'ア', ミュ: 'ウ', ミョ: 'オ',
  や: 'あ', ゆ: 'う', よ: 'お', ヤ: 'ア', ユ: 'ウ', ヨ: 'オ',
  ら: 'あ', り: 'い', る: 'う', れ: 'え', ろ: 'お',
  ラ: 'ア', リ: 'イ', ル: 'ウ', レ: 'エ', ロ: 'オ',
  りゃ: 'あ', りゅ: 'う', りょ: 'お', リャ: 'ア', リュ: 'ウ', リョ: 'オ',
  わ: 'あ', を: 'お', ん: 'ん', ワ: 'ア', ヲ: 'オ', ン: 'ン',
  が: 'あ', ぎ: 'い', ぐ: 'う', げ: 'え', ご: 'お',
  ガ: 'ア', ギ: 'イ', グ: 'ウ', ゲ: 'エ', ゴ: 'オ',
  ぎゃ: 'あ', ぎゅ: 'う', ぎょ: 'お', ギャ: 'ア', ギュ: 'ウ', ギョ: 'オ',
  ざ: 'あ', じ: 'い', ず: 'う', ぜ: 'え', ぞ: 'お',
  ザ: 'ア', ジ: 'イ', ズ: 'ウ', ゼ: 'エ', ゾ: 'オ',
  じゃ: 'あ', じゅ: 'う', じょ: 'お', ジャ: 'ア', ジュ: 'ウ', ジョ: 'オ',
  だ: 'あ', ぢ: 'い', づ: 'う', で: 'え', ど: 'お',
  ダ: 'ア', ヂ: 'イ', ヅ: 'ウ', デ: 'エ', ド: 'オ',
  ぢゃ: 'あ', ぢゅ: 'う', ぢょ: 'お', ヂャ: 'ア', ヂュ: 'ウ', ヂョ: 'オ',
  ば: 'あ', び: 'い', ぶ: 'う', べ: 'え', ぼ: 'お',
  バ: 'ア', ビ: 'イ', ブ: 'ウ', ベ: 'エ', ボ: 'オ',
  びゃ: 'あ', びゅ: 'う', びょ: 'お', ビャ: 'ア', ビュ: 'ウ', ビョ: 'オ',
  ぱ: 'あ', ぴ: 'い', ぷ: 'う', ぺ: 'え', ぽ: 'お',
  パ: 'ア', ピ: 'イ', プ: 'ウ', ペ: 'エ', ポ: 'オ',
  ぴゃ: 'あ', ぴゅ: 'う', ぴょ: 'お', ピャ: 'ア', ピュ: 'ウ', ピョ: 'オ',
  ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お',
  ァ: 'ア', ィ: 'イ', ゥ: 'ウ', ェ: 'エ', ォ: 'オ',
  っ: '', ッ: '', ー: '',
  'う゛ぁ': 'あ', 'う゛ぃ': 'い', 'う゛ぇ': 'え', 'う゛ぉ': 'お',
  'ウ゛ァ': 'ア', 'ウ゛ィ': 'イ', 'ウ゛ェ': 'エ', 'ウ゛ォ': 'オ'
};

export type MemorizationScoreJson = ScoreJson & {
  '16thnoteframe_length': number;
  __type?: string;
};

export type PhraseRange = readonly [start: number, end: number];

export type MemorizationScoreResult = {
  score: MemorizationScoreJson;
  phraseRanges: PhraseRange[];
  difference: number;
};

export type MemorizationSynthesisSegment = {
  score: ScoreJson;
  speakerId: number;
  leadingPaddingFrames: number;
};

function cloneNote(note: ScoreNote): ScoreNote {
  return { ...note };
}

function splitToMoraWithoutLongVowel(input: string): string[] {
  const chars = Array.from(input);
  const moras: string[] = [];
  for (let index = 0; index < chars.length; index += 1) {
    let mora = chars[index] ?? '';
    if (index + 1 < chars.length && smallKana.includes(chars[index + 1] ?? '')) {
      mora += chars[index + 1];
      index += 1;
    }
    moras.push(mora);
  }
  return moras;
}

function determinePhrases(score: ScoreJson): ScoreNote[][] {
  const phrases: ScoreNote[][] = [];
  let current: ScoreNote[] = [];
  let previousLyric: string | undefined;
  for (const source of score.notes) {
    const note = cloneNote(source);
    if (previousLyric !== undefined && note.lyric !== previousLyric) {
      if (current.length > 0) {
        phrases.push(current);
      }
      current = [];
    }
    current.push(note);
    previousLyric = note.lyric;
  }
  if (current.length > 0) {
    phrases.push(current);
  }
  return phrases;
}

function handleMoreMoraThanNotes(score: MemorizationScoreJson, moras: string[], notes: ScoreNote[]): void {
  const sixteenth = score['16thnoteframe_length'];
  const minimumSplitFrame = Math.max(1, Math.floor(sixteenth / 4));
  while (moras.length > notes.length) {
    const index = moras.findIndex((mora) => mora === 'っ' || mora === 'ッ');
    if (index < 0) break;
    moras.splice(index, 1);
  }
  while (moras.length > notes.length) {
    const index = moras.indexOf('ー');
    if (index < 0) break;
    moras.splice(index, 1);
  }

  while (moras.length > notes.length) {
    let longestIndex = 0;
    let maxFrame = 0;
    for (let index = 0; index < notes.length - 1; index += 1) {
      if ((notes[index]?.frame_length ?? 0) > maxFrame) {
        maxFrame = notes[index]?.frame_length ?? 0;
        longestIndex = index;
      }
    }

    let handledN = false;
    for (let index = 1; index < moras.length; index += 1) {
      if (moras[index] !== 'ん' && moras[index] !== 'ン') continue;
      const targetIndex = index - 1;
      const target = notes[targetIndex];
      if (!target || targetIndex >= longestIndex || notes[index]?.frame_length === sixteenth) break;
      if (target.frame_length >= minimumSplitFrame * 2) {
        const lengthForN = Math.min(sixteenth, target.frame_length - minimumSplitFrame);
        const precedingLength = target.frame_length - lengthForN;
        if (precedingLength >= minimumSplitFrame) {
          target.frame_length = precedingLength;
          notes.splice(targetIndex + 1, 0, {
            frame_length: lengthForN,
            key: target.key,
            notelen: target.notelen,
            lyric: 'ん'
          });
          handledN = true;
        }
      }
      break;
    }
    if (handledN) continue;
    if (maxFrame < minimumSplitFrame * 2) break;

    if (longestIndex === notes.length - 1) {
      const alternative = notes.findIndex((note, index) => index < notes.length - 1 && note.frame_length >= minimumSplitFrame * 2);
      if (alternative >= 0) {
        longestIndex = alternative;
      }
    }
    const longest = notes[longestIndex];
    if (!longest) break;
    const firstLength = Math.floor(longest.frame_length / 2);
    const secondLength = longest.frame_length - firstLength;
    const originalCount = notes.length;
    notes.splice(longestIndex, 1,
      { ...longest, frame_length: firstLength, lyric: moras[originalCount - 1] ?? '' },
      { ...longest, frame_length: secondLength, lyric: moras[originalCount] ?? '' });
  }
}

function handleMoreNotesThanMora(moras: string[], notes: ScoreNote[]): void {
  while (moras.length < notes.length) {
    const originalLength = moras.length;
    for (let index = 0; index < originalLength && moras.length < notes.length; index += 1) {
      if (moras[index] === 'ー') {
        moras.splice(index, 0, 'ー');
        index += 1;
      }
    }
    if (moras.length >= notes.length) break;

    const insertions: Array<[number, string]> = [];
    for (let index = 0; index < moras.length && moras.length + insertions.length < notes.length; index += 1) {
      const mora = moras[index] ?? '';
      if (!['あ', 'い', 'う', 'え', 'お'].includes(mora)) continue;
      let consecutive = 1;
      for (let cursor = index - 1; cursor >= 0 && moras[cursor] === mora; cursor -= 1) consecutive += 1;
      for (let cursor = index + 1; cursor < moras.length && moras[cursor] === mora; cursor += 1) consecutive += 1;
      if (consecutive < 3) insertions.push([index + 1, mora]);
    }
    let offset = 0;
    for (const [index, mora] of insertions) {
      moras.splice(index + offset, 0, mora);
      offset += 1;
    }
    if (moras.length >= notes.length) break;

    const vowel = vowelMap[moras.at(-1) ?? ''] ?? '';
    if (vowel) {
      let consecutive = 0;
      for (let index = moras.length - 1; index >= 0 && moras[index] === vowel; index -= 1) consecutive += 1;
      if (consecutive < 3) moras.push(vowel);
    }
    while (moras.length < notes.length) moras.push('っ');
  }
}

function adjustMoraAndNotes(score: MemorizationScoreJson, moras: string[], notes: ScoreNote[]): boolean {
  let attempts = 0;
  while (moras.length !== notes.length && attempts < 100) {
    if (moras.length > notes.length) handleMoreMoraThanNotes(score, moras, notes);
    else handleMoreNotesThanMora(moras, notes);
    attempts += 1;
  }
  if (moras.length !== notes.length) return false;
  notes.forEach((note, index) => { note.lyric = moras[index] ?? ''; });
  return true;
}

function processLyrics(score: MemorizationScoreJson, lyricListSource: string[][], phrases: ScoreNote[][]): { difference: number; phraseEnds: number[] } {
  const lyricList = lyricListSource.map((moras) => [...moras]);
  let difference = 0;
  let lyricIndex = 0;
  let phraseIndex = 1;
  const phraseEnds: number[] = [];

  while (lyricIndex < lyricList.length && phraseIndex < phrases.length) {
    const notes = phrases[phraseIndex];
    if (!notes) break;
    let adjusted = false;
    while (!adjusted) {
      const moras = [...(lyricList[lyricIndex] ?? [])];
      if (moras.length === 0) break;
      difference += Math.abs(moras.length - notes.length);
      if (adjustMoraAndNotes(score, moras, notes)) {
        lyricIndex += 1;
        adjusted = true;
        phraseEnds.push(phraseIndex);
        break;
      }

      const lastWordIndex = lyricIndex;
      const lastWord = lyricList[lastWordIndex];
      if (!lastWord) break;
      const neededFromLastWord = notes.length;
      if (neededFromLastWord <= 0 || neededFromLastWord >= lastWord.length) break;
      lyricList.splice(lastWordIndex, 1, lastWord.slice(0, neededFromLastWord), lastWord.slice(neededFromLastWord));
    }
    phraseIndex += 1;
  }

  return { difference, phraseEnds };
}

function replaceLongVowelMarks(phrases: ScoreNote[][]): void {
  for (const phrase of phrases) {
    for (let index = 1; index < phrase.length; index += 1) {
      if (phrase[index]?.lyric === 'ー') {
        const vowel = vowelMap[phrase[index - 1]?.lyric ?? ''];
        if (vowel && phrase[index]) phrase[index].lyric = vowel;
      }
    }
  }
}

export function buildOnomatopoeiaLyricsRows(tasks: SolvedTask[]): Array<[string, string]> {
  return tasks.flatMap((task): Array<[string, string]> => {
    return typeof task.singingReading === 'string' && task.singingReading.length > 0
      ? [[task.userInput, task.singingReading]]
      : [];
  });
}

export function createMemorizationScore(
  lyricsRows: ReadonlyArray<readonly [displayText: string, singingReading: string]>,
  originalScore: MemorizationScoreJson
): MemorizationScoreResult {
  const working: MemorizationScoreJson = {
    ...originalScore,
    notes: originalScore.notes.map(cloneNote)
  };
  const phrases = determinePhrases(working);
  const lyricList = lyricsRows
    .map((row) => row[1])
    .filter((reading) => reading.length > 0)
    .map(splitToMoraWithoutLongVowel);
  const { difference, phraseEnds } = processLyrics(working, lyricList, phrases);
  replaceLongVowelMarks(phrases);

  const lastPhraseIndex = phraseEnds.at(-1) ?? 0;
  const usedPhrases = phrases.slice(0, lastPhraseIndex + 1);
  const phraseRanges: PhraseRange[] = [];
  let offset = usedPhrases[0]?.length ?? 0;
  for (let index = 1; index < usedPhrases.length; index += 1) {
    const start = index === 1 ? 0 : offset;
    offset += usedPhrases[index]?.length ?? 0;
    phraseRanges.push([start, offset]);
  }

  return {
    score: {
      ...working,
      __type: `Difference:${difference}`,
      notes: usedPhrases.flatMap((phrase) => phrase.map(cloneNote))
    },
    phraseRanges,
    difference
  };
}

export function extractOnomatopoeiaLineCorrects(tasks: SolvedTask[]): boolean[] {
  return tasks
    .filter((task) => typeof task.singingReading === 'string' && task.singingReading.length > 0)
    .map((task) => task.isCorrect !== false);
}

export function buildMemorizationSynthesisPlan(
  score: ScoreJson,
  phraseRanges: ReadonlyArray<PhraseRange>,
  lineCorrects: readonly boolean[]
): MemorizationSynthesisSegment[] {
  return phraseRanges.flatMap(([start, end], index) => {
    const notes = score.notes.slice(start, end).map(cloneNote);
    if (notes.length === 0) return [];
    const leadingPaddingFrames = notes[0]?.notelen === 'R' ? 0 : 2;
    if (leadingPaddingFrames > 0) {
      notes.unshift({ frame_length: leadingPaddingFrames, key: null, lyric: '', notelen: 'R' });
    }
    return [{
      score: { notes },
      speakerId: lineCorrects[index] === false ? incorrectSpeakerId : normalSpeakerId,
      leadingPaddingFrames
    }];
  });
}
