import { splitSyllables } from './kana';
import type { JsonObject, ParsedTargetText, SolvedTask, TalkProblem } from './types';

const frameRate = 93.75;
const syllableSeparator = '\x1f';

const lyricDisplayCorrection = new Map<string, string>([
  ['ワ', 'は'],
  ['ヲ', 'を'],
  ['ヘ', 'へ'],
  ['ヴ', 'ブ'],
  ['シェ', 'しぇ'],
  ['ティ', 'てぃ'],
  ['ディ', 'でぃ'],
  ['チェ', 'ちぇ'],
  ['ウィ', 'うぃ'],
  ['クヮ', 'くぁ'],
  ['グヮ', 'ぐぁ'],
  ['ァ', ''],
  ['ィ', ''],
  ['ゥ', ''],
  ['ェ', ''],
  ['ォ', ''],
  ['ア', 'ー'],
  ['イ', 'ー'],
  ['ウ', 'ー'],
  ['エ', 'ー'],
  ['オ', 'ー']
]);

export type ScoreNote = {
  frame_length: number;
  key: number | null;
  lyric: string;
  notelen: string;
};

export type ScoreJson = {
  notes: ScoreNote[];
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown): JsonObject | undefined {
  return isRecord(value) ? value : undefined;
}

function getArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function midiToName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

function calcFrameLen(ticks: number, bpm: number, tpqn: number, carryRef: { value: number }): number {
  const beats = ticks / tpqn;
  const sec = beats * (60 / bpm);
  const frames = sec * frameRate + carryRef.value;
  const frameLength = Math.max(1, Math.floor(frames + 0.5));
  carryRef.value = frames - frameLength;
  return frameLength;
}

function getFirstBpm(song: JsonObject): number {
  const tempos = getArray(song.tempos);
  const firstTempo = tempos ? getRecord(tempos[0]) : undefined;
  return getNumber(firstTempo?.bpm, 120);
}

function buildSyllableKey(syllables: string[]): string {
  return syllables.join(syllableSeparator);
}

function correctLyricForDisplay(lyric: string): string {
  return lyricDisplayCorrection.get(lyric) ?? lyric;
}

function correctTextForDisplay(text: string): string {
  const entries = [...lyricDisplayCorrection.entries()].sort((a, b) => b[0].length - a[0].length);
  let out = '';
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const [from, to] of entries) {
      if (from.length > 0 && text.startsWith(from, i)) {
        out += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i] ?? '';
      i += 1;
    }
  }

  return out;
}

function findAllSubstringStarts(text: string, pattern: string): number[] {
  const starts: number[] = [];
  if (pattern.length === 0) {
    return starts;
  }

  let pos = 0;
  while (pos <= text.length) {
    const found = text.indexOf(pattern, pos);
    if (found < 0) {
      break;
    }
    starts.push(found);
    pos = found + pattern.length;
  }
  return starts;
}

function findSequenceOccurrenceStarts(lyricsSeq: string[], target: string[]): number[] {
  const starts: number[] = [];
  if (target.length === 0) {
    return starts;
  }

  for (let start = 0; start + target.length <= lyricsSeq.length; start += 1) {
    let match = true;
    for (let k = 0; k < target.length; k += 1) {
      if (lyricsSeq[start + k] !== target[k]) {
        match = false;
        break;
      }
    }
    if (match) {
      starts.push(start);
    }
  }

  return starts;
}

function overwriteSequenceAt(lyricsSeq: string[], start: number, replacement: string[]): boolean {
  if (replacement.length === 0 || start + replacement.length > lyricsSeq.length) {
    return false;
  }
  for (let k = 0; k < replacement.length; k += 1) {
    lyricsSeq[start + k] = replacement[k] ?? '';
  }
  return true;
}

function getTrackKeysInOrder(song: JsonObject): string[] {
  const tracks = getRecord(song.tracks);
  if (!tracks) {
    return [];
  }

  const ordered: string[] = [];
  const trackOrder = getArray(song.trackOrder);
  if (trackOrder) {
    for (const key of trackOrder) {
      const trackKey = getString(key);
      if (trackKey && isRecord(tracks[trackKey])) {
        ordered.push(trackKey);
      }
    }
  }

  if (ordered.length === 0) {
    for (const [key, value] of Object.entries(tracks)) {
      if (isRecord(value)) {
        ordered.push(key);
      }
    }
  }

  return ordered;
}

function selectTrackByIndex(vvproj: unknown, trackIndex = 0): JsonObject | undefined {
  const root = getRecord(vvproj);
  const song = getRecord(root?.song);
  const tracks = getRecord(song?.tracks);
  if (!song || !tracks) {
    return undefined;
  }

  const orderedKeys = getTrackKeysInOrder(song);
  const trackKey = orderedKeys[trackIndex] ?? orderedKeys[0];
  const track = trackKey ? getRecord(tracks[trackKey]) : undefined;
  if (track) {
    return track;
  }

  return Object.values(tracks).find(isRecord);
}

export function extractTalkUtterances(vvproj: unknown): string[] {
  const root = getRecord(vvproj);
  const talk = getRecord(root?.talk);
  const audioKeys = getArray(talk?.audioKeys);
  const audioItems = getRecord(talk?.audioItems);
  if (!talk || !audioKeys || !audioItems) {
    return [];
  }

  const utterances: string[] = [];
  for (const keyNode of audioKeys) {
    const key = getString(keyNode);
    if (!key) {
      continue;
    }
    const item = getRecord(audioItems[key]);
    const text = getString(item?.text);
    if (text) {
      utterances.push(text);
    }
  }

  return utterances;
}

export function parseTargetText(text: string): ParsedTargetText {
  const open = text.indexOf('[');
  if (open < 0) {
    return { baseText: text, particleText: '' };
  }

  const close = text.indexOf(']', open + 1);
  if (close < 0 || close <= open) {
    return { baseText: text, particleText: '' };
  }

  const head = text.slice(0, open);
  const particleText = text.slice(open + 1, close);
  const tail = text.slice(close + 1);
  return {
    baseText: `${head}${particleText}${tail}`,
    particleText
  };
}

export function buildTalkProblems(talkLines: string[]): TalkProblem[] {
  if (talkLines.length === 0 || talkLines.length % 2 !== 0) {
    return [];
  }

  const count = talkLines.length / 2;
  const problems: TalkProblem[] = [];
  for (let i = 0; i < count; i += 1) {
    const rawTargetText = talkLines[i] ?? '';
    const questionText = talkLines[i + count] ?? '';
    const parsed = parseTargetText(rawTargetText);
    const targetSyllables = splitSyllables(parsed.baseText);
    problems.push({
      rawTargetText,
      baseTargetText: parsed.baseText,
      particleText: parsed.particleText,
      questionText,
      targetSyllables,
      maxSyllableCount: targetSyllables.length
    });
  }

  return problems;
}

export function getVvprojTrackName(vvproj: unknown, trackIndex = 0): string {
  const track = selectTrackByIndex(vvproj, trackIndex);
  return getString(track?.name);
}

export function applyParodyLyrics<T>(vvprojOriginal: T, solvedTasks: SolvedTask[]): T {
  const modified = cloneJson(vvprojOriginal);
  const root = getRecord(modified);
  const song = getRecord(root?.song);
  const tracks = getRecord(song?.tracks);
  if (!song || !tracks) {
    return modified;
  }

  for (const trackKey of getTrackKeysInOrder(song)) {
    const trackNode = getRecord(tracks[trackKey]);
    const noteList = getArray(trackNode?.notes)?.map((note) => cloneJson(note)) ?? [];
    if (!trackNode || noteList.length === 0) {
      continue;
    }

    noteList.sort((a, b) => {
      const ap = getNumber(getRecord(a)?.position);
      const bp = getNumber(getRecord(b)?.position);
      return ap - bp;
    });

    const lyricsSeq: string[] = [];
    const noteIndexMap: number[] = [];
    noteList.forEach((note, noteIndex) => {
      const noteObj = getRecord(note);
      const lyric = getString(noteObj?.lyric);
      if (lyric) {
        lyricsSeq.push(lyric);
        noteIndexMap.push(noteIndex);
      }
    });

    const originalLyricsSeq = [...lyricsSeq];
    const occurrenceStartsByKey = new Map<string, number[]>();
    const consumedOccurrenceCount = new Map<string, number>();

    for (const task of solvedTasks) {
      if (task.syllables.length === 0) {
        continue;
      }
      if (task.restPadding) {
        if (task.userSyllables.length === 0 || task.userSyllables.length > task.syllables.length) {
          continue;
        }
      } else if (task.syllables.length !== task.userSyllables.length) {
        continue;
      }

      const key = buildSyllableKey(task.syllables);
      if (!occurrenceStartsByKey.has(key)) {
        occurrenceStartsByKey.set(key, findSequenceOccurrenceStarts(originalLyricsSeq, task.syllables));
      }

      const starts = occurrenceStartsByKey.get(key) ?? [];
      const occurrence = consumedOccurrenceCount.get(key) ?? 0;
      if (occurrence >= starts.length) {
        continue;
      }

      const start = starts[occurrence] ?? 0;
      let replaced = false;

      if (task.restPadding) {
        for (let k = 0; k < task.syllables.length; k += 1) {
          const lyricIndex = start + k;
          const noteIndex = noteIndexMap[lyricIndex];
          const note = noteIndex !== undefined ? getRecord(noteList[noteIndex]) : undefined;
          if (lyricIndex >= lyricsSeq.length || noteIndex === undefined || !note) {
            continue;
          }
          if (k < task.userSyllables.length) {
            lyricsSeq[lyricIndex] = task.userSyllables[k] ?? '';
          } else {
            lyricsSeq[lyricIndex] = '';
            note.lyric = '';
            note.notelen = 'R';
          }
        }
        replaced = true;
      } else {
        replaced = overwriteSequenceAt(lyricsSeq, start, task.userSyllables);
      }

      if (replaced) {
        consumedOccurrenceCount.set(key, occurrence + 1);
      }
    }

    noteIndexMap.forEach((noteIndex, lyricsIndex) => {
      const note = getRecord(noteList[noteIndex]);
      if (note) {
        note.lyric = lyricsSeq[lyricsIndex] ?? '';
      }
    });

    trackNode.notes = noteList;
    tracks[trackKey] = trackNode;
  }

  return modified;
}

export function buildResultDisplayLyrics(vvproj: unknown, solvedTasks: SolvedTask[]): string {
  const track = selectTrackByIndex(vvproj, 0);
  const notes = getArray(track?.notes)?.map((note) => cloneJson(note)) ?? [];
  if (notes.length === 0) {
    return '';
  }

  notes.sort((a, b) => getNumber(getRecord(a)?.position) - getNumber(getRecord(b)?.position));

  const problems = buildTalkProblems(extractTalkUtterances(vvproj));

  let originalLyrics = '';
  let prevEnd = -1;
  for (const note of notes) {
    const noteObj = getRecord(note);
    const pos = getNumber(noteObj?.position);
    const dur = getNumber(noteObj?.duration);
    if (prevEnd >= 0 && pos - prevEnd > 0) {
      originalLyrics += '\n';
    }
    const lyric = getString(noteObj?.lyric);
    if (lyric) {
      originalLyrics += correctLyricForDisplay(lyric);
    }
    prevEnd = pos + dur;
  }

  if (!originalLyrics) {
    return originalLyrics;
  }

  type ReplacementEvent = {
    start: number;
    end: number;
    replacement: string;
  };

  const occurrenceStartsByTarget = new Map<string, number[]>();
  const consumedOccurrenceCount = new Map<string, number>();
  const events: ReplacementEvent[] = [];

  const buildDisplayInput = (taskIndex: number, task: SolvedTask): string => {
    let display = task.userInput;
    const problem = problems[taskIndex];
    if (!problem || !problem.particleText || problem.maxSyllableCount === 0) {
      return display;
    }

    const inputSyllableCount = splitSyllables(task.userInput).length;
    if (inputSyllableCount >= problem.maxSyllableCount) {
      return display;
    }

    const particleSyllables = splitSyllables(problem.particleText);
    if (particleSyllables.length === 0 || task.userSyllables.length < particleSyllables.length) {
      return display;
    }

    const suffixStart = task.userSyllables.length - particleSyllables.length;
    for (let i = 0; i < particleSyllables.length; i += 1) {
      if (task.userSyllables[suffixStart + i] !== particleSyllables[i]) {
        return display;
      }
    }

    display += correctTextForDisplay(problem.particleText);
    return display;
  };

  solvedTasks.forEach((task, taskIndex) => {
    if (!task.phrase) {
      return;
    }

    const target = correctTextForDisplay(task.phrase);
    if (!target) {
      return;
    }

    if (!occurrenceStartsByTarget.has(target)) {
      occurrenceStartsByTarget.set(target, findAllSubstringStarts(originalLyrics, target));
    }

    const starts = occurrenceStartsByTarget.get(target) ?? [];
    const occurrence = consumedOccurrenceCount.get(target) ?? 0;
    if (occurrence >= starts.length) {
      return;
    }

    const start = starts[occurrence] ?? 0;
    events.push({
      start,
      end: start + target.length,
      replacement: buildDisplayInput(taskIndex, task)
    });
    consumedOccurrenceCount.set(target, occurrence + 1);
  });

  events.sort((a, b) => a.start - b.start);

  let displayLyrics = '';
  let cursor = 0;
  for (const event of events) {
    if (event.start < cursor || event.end > originalLyrics.length) {
      continue;
    }
    displayLyrics += originalLyrics.slice(cursor, event.start);
    displayLyrics += event.replacement;
    cursor = event.end;
  }
  displayLyrics += originalLyrics.slice(cursor);

  return displayLyrics;
}

export function extractSongLyrics(vvproj: unknown): string[] {
  const track = selectTrackByIndex(vvproj, 0);
  const notes = getArray(track?.notes)?.map((note) => cloneJson(note)) ?? [];
  if (notes.length === 0) {
    return [];
  }

  notes.sort((a, b) => getNumber(getRecord(a)?.position) - getNumber(getRecord(b)?.position));

  const lyrics: string[] = [];
  let prevEnd = -1;
  for (const note of notes) {
    const noteObj = getRecord(note);
    const pos = getNumber(noteObj?.position);
    const dur = getNumber(noteObj?.duration);
    if (prevEnd >= 0 && pos - prevEnd > 0) {
      lyrics.push('\n');
    }
    const lyric = getString(noteObj?.lyric);
    if (lyric) {
      lyrics.push(correctLyricForDisplay(lyric));
    }
    prevEnd = pos + dur;
  }

  return lyrics;
}

export function convertVVProjToScoreJSON(vvproj: unknown, trackIndex = 0): ScoreJson {
  const root = getRecord(vvproj);
  const song = getRecord(root?.song);
  const track = selectTrackByIndex(vvproj, trackIndex);
  const notes = getArray(track?.notes);
  if (!song || !track || !notes) {
    throw new Error('有効な song track notes が見つかりません');
  }

  const tpqn = getNumber(song.tpqn, 480);
  const bpm = getFirstBpm(song);
  const carry = { value: 0 };
  const outNotes: ScoreNote[] = [];
  const putRest = (frameLength: number) => {
    outNotes.push({
      frame_length: frameLength,
      key: null,
      lyric: '',
      notelen: 'R'
    });
  };

  putRest(2);

  const sortedNotes = notes.map((note) => cloneJson(note)).sort((a, b) => {
    return getNumber(getRecord(a)?.position) - getNumber(getRecord(b)?.position);
  });

  let prevEnd = 0;
  for (const note of sortedNotes) {
    const noteObj = getRecord(note);
    if (!noteObj) {
      continue;
    }
    const pos = getNumber(noteObj.position);
    const dur = getNumber(noteObj.duration);
    const gap = pos - prevEnd;
    if (gap > 0) {
      putRest(calcFrameLen(gap, bpm, tpqn, carry));
    }

    if (getString(noteObj.notelen) === 'R') {
      putRest(calcFrameLen(dur, bpm, tpqn, carry));
      prevEnd = pos + dur;
      continue;
    }

    const midi = Math.trunc(getNumber(noteObj.noteNumber));
    outNotes.push({
      frame_length: calcFrameLen(dur, bpm, tpqn, carry),
      key: midi,
      lyric: getString(noteObj.lyric),
      notelen: midiToName(midi)
    });

    prevEnd = pos + dur;
  }

  putRest(2);

  return { notes: outNotes };
}

export function transposeScoreJSON(score: ScoreJson, semitone: number): ScoreJson {
  return {
    notes: score.notes.map((note) => {
      if (typeof note.key !== 'number') {
        return { ...note };
      }
      const midi = Math.max(0, Math.min(127, Math.trunc(note.key + semitone)));
      return {
        ...note,
        key: midi,
        notelen: midiToName(midi)
      };
    })
  };
}

export function transposeSingQueryJSON<T extends JsonObject>(query: T, semitone: number): T {
  const cloned = cloneJson(query) as JsonObject;
  const ratio = 2 ** (semitone / 12);
  const f0 = getArray(cloned.f0);
  if (f0) {
    cloned.f0 = f0.map((value) => (typeof value === 'number' ? value * ratio : value));
  }

  const phonemes = getArray(cloned.phonemes);
  if (phonemes) {
    cloned.phonemes = phonemes.map((phoneme) => {
      const item = getRecord(phoneme);
      if (!item) {
        return phoneme;
      }
      const noteId = item.note_id;
      return typeof noteId === 'number' ? { ...item, note_id: noteId + semitone } : item;
    });
  }

  return cloned as T;
}

export function getKeyAdjustment(singer: string, style: string): number {
  const table: Record<string, Record<string, number>> = {
    四国めたん: { ノーマル: -4, あまあま: -4, ツンツン: -5, セクシー: -4, ヒソヒソ: -9 },
    ずんだもん: { ノーマル: -2, あまあま: 0, ツンツン: -3, セクシー: 0, ヒソヒソ: -7, ヘロヘロ: -3, なみだめ: 6 },
    春日部つむぎ: { ノーマル: -2 },
    雨晴はう: { ノーマル: 0 },
    波音リツ: { ノーマル: -8, クイーン: -5 },
    WhiteCUL: { ノーマル: -6, たのしい: -3, かなしい: -7, 'びえーん': 0 }
  };

  return table[singer]?.[style] ?? 0;
}
