import fs from 'node:fs/promises';
import path from 'node:path';
import { parseCsvRows } from '../../shared/src/csv';
import {
  buildTalkProblems,
  extractTalkUtterances,
  getVvprojTrackName
} from '../../shared/src/vvproj';
import { onomatopoeiaExamples } from '../../shared/src/memorizationScore';
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
  const text = (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
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
  const specialCandidates = title === 'ハッピーバースデー'
    ? ['HappyBirthday.wav']
    : title === 'オノマトペ'
      ? ['幸せなら手をたたこう.wav']
      : [];
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
      baseScoreFileName: title === 'オノマトペ' ? '幸せなら手をたたこう.json' : undefined,
      baseScoreUrl: title === 'オノマトペ' ? toAssetUrl('score', '幸せなら手をたたこう.json') : undefined,
      mode: detectMode(title),
      trackName: title === 'オノマトペ' ? '幸せなら手をたたこう' : trackName
    });
  }

  return songs;
}

export async function resolveSong(id: string): Promise<{
  info: SongInfo;
  vvprojPath: string;
  vvproj: unknown;
  baseScore?: unknown;
} | undefined> {
  const title = decodeSongId(id);
  const songs = await listSongs();
  const info = songs.find((song) => song.title === title);
  if (!info) {
    return undefined;
  }

  const vvprojPath = path.join(scoreDir, info.vvprojFileName);
  const vvproj = await readJsonFile(vvprojPath);
  const baseScore = info.baseScoreFileName
    ? await readJsonFile(path.join(scoreDir, info.baseScoreFileName))
    : undefined;
  return { info, vvprojPath, vvproj, baseScore };
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
  return onomatopoeiaExamples.map((example) => ({ ...example }));
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
