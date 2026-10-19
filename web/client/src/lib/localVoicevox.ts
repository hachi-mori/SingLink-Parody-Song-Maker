import { memorizationSourceSongs } from '@shared/memorizationSongs';
import type { DatasetId, SongDetail } from '@shared/types';
import { assetUrl } from './assets';
import { assertKnownDataset } from './quizDatasets';

/** Check the raw spelling as well as the origin: reject aliases, credentials,
 * nonstandard numeric IPs, paths, queries, fragments and encoded hostnames. */
export function voicevoxBaseUrlForDataset(raw: string, datasetId: DatasetId): string {
  assertKnownDataset(datasetId);
  if (datasetId === 'browserImport' && (raw !== raw.trim() || !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):50021\/?$/u.test(raw))) {
    throw new Error('インポート教材の接続先は同じPCの http://localhost:50021、http://127.0.0.1:50021、http://[::1]:50021 のみです。');
  }
  return raw.replace(/\/+$/u, '');
}

/** Never follow a redirect while carrying imported teaching text. */
export const privateFetchOptions = {
  redirect: 'error',
  credentials: 'omit',
  referrerPolicy: 'no-referrer'
} as const satisfies RequestInit;

export function privateSourceSong(song: SongDetail) {
  const source = memorizationSourceSongs.find((candidate) => candidate.id === song.sourceSong?.id);
  if (song.mode !== 'onomatopoeiaQuiz' || !source) throw new Error('インポート教材では同梱の曲を選択してください。');
  return {
    scoreUrl: assetUrl(`assets/score/${source.scoreFileName}`),
    instUrl: assetUrl(`assets/inst/${source.instFileName}`)
  };
}
