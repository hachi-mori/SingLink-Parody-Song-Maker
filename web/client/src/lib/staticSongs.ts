import { buildResultDisplayLyrics, buildTalkProblems, extractTalkUtterances, getVvprojTrackName } from '@shared/vvproj';
import { parseOnomatopoeiaCardEntries } from '@shared/onomatopoeiaCards';
import { memorizationSourceSongs } from '@shared/memorizationSongs';
import type {
  OnomatopoeiaEntry,
  SongDetail,
  SongInfo,
  SongMode,
  SourceSongInfo,
  SynthesisRequest
} from '@shared/types';
import { assetUrl } from './assets';

type StaticSongAsset = {
  vvprojFileName: string;
  instFileName?: string;
  baseScoreFileName?: string;
};

const staticSongAssets: StaticSongAsset[] = [
  {
    vvprojFileName: 'オノマトペ.vvproj',
    instFileName: '幸せなら手をたたこう.wav',
    baseScoreFileName: '幸せなら手をたたこう.json'
  }
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

function detectMode(_title: string): SongMode {
  return 'onomatopoeiaQuiz';
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

async function loadOnomatopoeiaEntries(): Promise<OnomatopoeiaEntry[]> {
  const [cards, singingReadings] = await Promise.all([
    fetchJson('assets/dict/cards_text_data.json'),
    fetchJson('assets/dict/cards_singing_readings.json')
  ]);
  return parseOnomatopoeiaCardEntries(cards, singingReadings);
}

export function getStaticMemorizationSourceSongs(): SourceSongInfo[] {
  return memorizationSourceSongs.map((song) => ({
    ...song,
    scoreUrl: assetUrl(`assets/score/${song.scoreFileName}`),
    instUrl: assetUrl(`assets/inst/${song.instFileName}`)
  }));
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
      baseScoreFileName: asset.baseScoreFileName,
      baseScoreUrl: asset.baseScoreFileName ? assetUrl(`assets/score/${asset.baseScoreFileName}`) : undefined,
      mode: detectMode(title),
      trackName: title === 'オノマトペ' ? '幸せなら手をたたこう' : trackName
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
