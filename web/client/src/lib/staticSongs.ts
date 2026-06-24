import { parseCsvRows } from '@shared/csv';
import { buildResultDisplayLyrics, buildTalkProblems, extractTalkUtterances, getVvprojTrackName } from '@shared/vvproj';
import { replaceChoonWithVowel, splitOnomatopoeiaMoras } from '@shared/kana';
import { parseOnomatopoeiaCardEntries } from '@shared/onomatopoeiaCards';
import type { OnomatopoeiaEntry, SongDetail, SongInfo, SongMode, SynthesisRequest, VerbEntry } from '@shared/types';
import { assetUrl } from './assets';

type StaticSongAsset = {
  vvprojFileName: string;
  instFileName?: string;
};

const staticSongAssets: StaticSongAsset[] = [
  { vvprojFileName: 'オノマトペ.vvproj', instFileName: 'オノマトペ.mp3' },
  { vvprojFileName: 'ハッピーバースデー.vvproj', instFileName: 'HappyBirthday.wav' },
  { vvprojFileName: '動詞グループ.vvproj', instFileName: '動詞グループ.mp3' },
  { vvprojFileName: '呼び込みくん.vvproj', instFileName: '呼び込みくん.mp3' },
  { vvprojFileName: '呼び込みくんっぽい曲.vvproj', instFileName: '呼び込みくんっぽい曲.mp3' }
];

function makeSongId(title: string): string {
  const bytes = new TextEncoder().encode(title);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function titleFromVvproj(fileName: string): string {
  return fileName.replace(/\.vvproj$/i, '');
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

async function fetchText(path: string): Promise<string> {
  const response = await fetch(assetUrl(path));
  if (!response.ok) {
    throw new Error(`${path} を読み込めませんでした`);
  }
  return response.text();
}

async function fetchJson(path: string): Promise<unknown> {
  return JSON.parse(await fetchText(path)) as unknown;
}

async function fetchOptionalJson(path: string): Promise<unknown | undefined> {
  try {
    return await fetchJson(path);
  } catch {
    return undefined;
  }
}

async function loadVerbEntries(): Promise<VerbEntry[]> {
  const rows = parseCsvRows(await fetchText('assets/dict/Verb.csv'));
  return rows.flatMap((fields) => {
    const word = (fields[1] ?? '').trim();
    const reading = (fields[2] ?? '').trim();
    const group = (fields[4] ?? '').trim();
    return word && reading && group.includes('動詞') ? [{ word, reading, group }] : [];
  });
}

async function loadOnomatopoeiaEntries(): Promise<OnomatopoeiaEntry[]> {
  const cardsJson = await fetchOptionalJson('assets/dict/cards_text_data.json');
  const cardEntries = cardsJson ? parseOnomatopoeiaCardEntries(cardsJson) : [];
  if (cardEntries.length > 0) {
    return cardEntries;
  }

  const rows = parseCsvRows(await fetchText('assets/dict/オノマトペ.csv'));
  return rows.flatMap((fields) => {
    const word = (fields[0] ?? '').trim();
    const reading = (fields[1] ?? '').trim();
    const answer = (fields[2] ?? '').trim();
    const explanation = (fields[3] ?? '').trim();
    const readingMoraCount = splitOnomatopoeiaMoras(replaceChoonWithVowel(reading)).length;
    const answerMoraCount = splitOnomatopoeiaMoras(replaceChoonWithVowel(answer)).length;
    return word && reading && answer && readingMoraCount <= 8 && answerMoraCount <= 6
      ? [{ word, reading, answer, explanation }]
      : [];
  });
}

export async function fetchStaticSongs(): Promise<SongInfo[]> {
  const songs = await Promise.all(staticSongAssets.map(async (asset) => {
    const title = titleFromVvproj(asset.vvprojFileName);
    let trackName = '';
    try {
      trackName = getVvprojTrackName(await fetchJson(`assets/score/${asset.vvprojFileName}`), 0);
    } catch {
      trackName = '';
    }

    return {
      id: makeSongId(title),
      title,
      vvprojFileName: asset.vvprojFileName,
      vvprojUrl: assetUrl(`assets/score/${asset.vvprojFileName}`),
      instFileName: asset.instFileName,
      instUrl: asset.instFileName ? assetUrl(`assets/inst/${asset.instFileName}`) : undefined,
      mode: detectMode(title),
      trackName
    };
  }));

  return songs.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

export async function fetchStaticSongDetail(songId: string): Promise<SongDetail> {
  const songs = await fetchStaticSongs();
  const info = songs.find((song) => song.id === songId);
  if (!info) {
    throw new Error('曲データが見つかりませんでした');
  }

  const vvproj = await fetchJson(`assets/score/${info.vvprojFileName}`);
  const detail: SongDetail = {
    ...info,
    problems: info.mode === 'onomatopoeiaQuiz' ? [] : buildTalkProblems(extractTalkUtterances(vvproj))
  };

  if (info.mode === 'verbQuiz') {
    detail.verbEntries = await loadVerbEntries();
  }
  if (info.mode === 'onomatopoeiaQuiz') {
    detail.onomatopoeiaEntries = await loadOnomatopoeiaEntries();
  }

  return detail;
}

export async function previewStaticLyrics(songId: string, solvedTasks: SynthesisRequest['solvedTasks']): Promise<string> {
  const detail = await fetchStaticSongDetail(songId);
  if (detail.mode === 'onomatopoeiaQuiz') {
    return '';
  }
  const vvproj = await fetchJson(`assets/score/${detail.vvprojFileName}`);
  return buildResultDisplayLyrics(vvproj, solvedTasks);
}
