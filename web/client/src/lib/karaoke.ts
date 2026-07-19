import {
  buildKaraokeLineTimings,
  buildOnomatopoeiaLyricsRows,
  createMemorizationScore,
  type MemorizationScoreJson
} from '@shared/memorizationScore';
import type { KaraokeLineTiming, SolvedTask, SongDetail } from '@shared/types';

export async function buildSongKaraokeTimings(
  song: SongDetail,
  tasks: SolvedTask[],
  fullLyrics: string
): Promise<KaraokeLineTiming[]> {
  if (song.mode !== 'onomatopoeiaQuiz') return [];
  const scoreUrl = song.sourceSong?.scoreUrl ?? song.baseScoreUrl;
  if (!scoreUrl) return [];
  const response = await fetch(scoreUrl);
  if (!response.ok) throw new Error(`Karaoke score could not be loaded: ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, '');
  const generated = createMemorizationScore(
    buildOnomatopoeiaLyricsRows(tasks),
    JSON.parse(text) as MemorizationScoreJson
  );
  const displayLines = fullLyrics.replace(/[{}]/g, '').split('\n').filter(Boolean);
  return buildKaraokeLineTimings(generated.score, generated.phraseRanges, undefined, displayLines);
}
