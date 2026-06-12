import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCsvRows } from '../../shared/src/csv';
import {
  buildTalkProblems,
  extractTalkUtterances,
  getVvprojTrackName
} from '../../shared/src/vvproj';
import {
  replaceChoonWithVowel,
  splitOnomatopoeiaMoras
} from '../../shared/src/kana';
import type { OnomatopoeiaEntry, SongDetail, SongInfo, SongMode, VerbEntry } from '../../shared/src/types';
import { dictDir, instDir, scoreDir, toAssetUrl } from './paths';

const scoreExtensions = new Set(['.vvproj']);
const instExtensions = ['.wav', '.mp3'];

export function makeSongId(title: string): string {
  return Buffer.from(title, 'utf8').toString('base64url');
}

export function decodeSongId(id: string): string {
  return Buffer.from(id, 'base64url').toString('utf8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listScoreFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(scoreDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && scoreExtensions.has(path.extname(entry.name)))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, 'ja'));
  } catch {
    return [];
  }
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text) as unknown;
}

function detectMode(title: string): SongMode {
  if (title === '動詞グループ') {
    return 'verbQuiz';
  }
  if (title === 'オノマトペ') {
    return 'onomatopoeiaQuiz';
  }
  return 'freeText';
}

async function resolveInstFile(title: string): Promise<string | undefined> {
  const specialCandidates = title === 'ハッピーバースデー' ? ['HappyBirthday.wav'] : [];
  const candidates = [
    ...specialCandidates,
    ...instExtensions.map((ext) => `${title}${ext}`)
  ];

  for (const candidate of candidates) {
    if (await fileExists(path.join(instDir, candidate))) {
      return candidate;
    }
  }

  return undefined;
}

export async function listSongs(): Promise<SongInfo[]> {
  const scoreFiles = await listScoreFiles();
  const songs: SongInfo[] = [];

  for (const vvprojFileName of scoreFiles) {
    const title = path.basename(vvprojFileName, '.vvproj');
    const instFileName = await resolveInstFile(title);
    let trackName = '';

    try {
      const vvproj = await readJsonFile(path.join(scoreDir, vvprojFileName));
      trackName = getVvprojTrackName(vvproj, 0);
    } catch {
      trackName = '';
    }

    songs.push({
      id: makeSongId(title),
      title,
      vvprojFileName,
      vvprojUrl: toAssetUrl('score', vvprojFileName),
      instFileName,
      instUrl: instFileName ? toAssetUrl('inst', instFileName) : undefined,
      mode: detectMode(title),
      trackName
    });
  }

  return songs;
}

export async function resolveSong(id: string): Promise<{ info: SongInfo; vvprojPath: string; vvproj: unknown } | undefined> {
  const title = decodeSongId(id);
  const songs = await listSongs();
  const info = songs.find((song) => song.title === title);
  if (!info) {
    return undefined;
  }

  const vvprojPath = path.join(scoreDir, info.vvprojFileName);
  const vvproj = await readJsonFile(vvprojPath);
  return { info, vvprojPath, vvproj };
}

async function readDictFile(fileName: string): Promise<string> {
  return fs.readFile(path.join(dictDir, fileName), 'utf8');
}

export async function loadVerbEntries(): Promise<VerbEntry[]> {
  const text = await readDictFile('Verb.csv');
  const rows = parseCsvRows(text);
  const entries: VerbEntry[] = [];

  for (const fields of rows) {
    if (fields.length < 5) {
      continue;
    }
    const word = (fields[1] ?? '').trim();
    const reading = (fields[2] ?? '').trim();
    const group = (fields[4] ?? '').trim();
    if (word && reading && group.includes('動詞')) {
      entries.push({ word, reading, group });
    }
  }

  return entries;
}

export async function loadOnomatopoeiaEntries(): Promise<OnomatopoeiaEntry[]> {
  const text = await readDictFile('オノマトペ.csv');
  const rows = parseCsvRows(text);
  const entries: OnomatopoeiaEntry[] = [];

  for (const fields of rows) {
    if (fields.length < 3) {
      continue;
    }
    const word = (fields[0] ?? '').trim();
    const reading = (fields[1] ?? '').trim();
    const answer = (fields[2] ?? '').trim();
    const explanation = (fields[3] ?? '').trim();
    const readingMoraCount = splitOnomatopoeiaMoras(replaceChoonWithVowel(reading)).length;
    const answerMoraCount = splitOnomatopoeiaMoras(replaceChoonWithVowel(answer)).length;

    if (word && reading && answer && readingMoraCount <= 8 && answerMoraCount <= 6) {
      entries.push({ word, reading, answer, explanation });
    }
  }

  return entries;
}

export async function getSongDetail(id: string): Promise<SongDetail | undefined> {
  const resolved = await resolveSong(id);
  if (!resolved) {
    return undefined;
  }

  const problems = resolved.info.mode === 'onomatopoeiaQuiz'
    ? []
    : buildTalkProblems(extractTalkUtterances(resolved.vvproj));

  const detail: SongDetail = {
    ...resolved.info,
    problems
  };

  if (resolved.info.mode === 'verbQuiz') {
    detail.verbEntries = await loadVerbEntries();
  }
  if (resolved.info.mode === 'onomatopoeiaQuiz') {
    detail.onomatopoeiaEntries = await loadOnomatopoeiaEntries();
  }

  return detail;
}
