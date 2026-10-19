import {
  buildKaraokeLineTimings,
  buildOnomatopoeiaLyricsRows,
  createMemorizationScore,
  type MemorizationScoreJson
} from '@shared/memorizationScore';
import type { DatasetId, KaraokeLineTiming, SolvedTask, SongDetail } from '@shared/types';
import { privateFetchOptions, privateSourceSong } from './localVoicevox';

export async function buildSongKaraokeTimings(
  song: SongDetail,
  tasks: SolvedTask[],
  fullLyrics: string,
  datasetId: DatasetId = 'original335'
): Promise<KaraokeLineTiming[]> {
  if (song.mode !== 'onomatopoeiaQuiz') return [];
  const scoreUrl = datasetId === 'browserImport' ? privateSourceSong(song).scoreUrl : song.sourceSong?.scoreUrl ?? song.baseScoreUrl;
  if (!scoreUrl) return [];
  const response = await fetch(scoreUrl, datasetId === 'browserImport' ? privateFetchOptions : undefined);
  if (!response.ok) throw new Error(`Karaoke score could not be loaded: ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, '');
  const generated = createMemorizationScore(
    buildOnomatopoeiaLyricsRows(tasks),
    JSON.parse(text) as MemorizationScoreJson
  );
  const displayLines = fullLyrics.replace(/[{}]/g, '').split('\n').filter(Boolean);
  return buildKaraokeLineTimings(generated.score, generated.phraseRanges, undefined, displayLines);
}
