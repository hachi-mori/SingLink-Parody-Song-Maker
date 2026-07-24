export type MemorizationSourceSongAsset = {
  id: string;
  title: string;
  scoreFileName: string;
  instFileName: string;
};

export const defaultMemorizationSourceSongId = 'shiawase-nara-tewo-tatakou';

export const memorizationSourceSongs: readonly MemorizationSourceSongAsset[] = [
  {
    id: 'choucho',
    title: 'ちょうちょ',
    scoreFileName: 'ちょうちょ.json',
    instFileName: 'ちょうちょ.wav'
  },
  {
    id: 'musunde-hiraite',
    title: 'むすんでひらいて',
    scoreFileName: 'むすんでひらいて.json',
    instFileName: 'むすんでひらいて.wav'
  },
  {
    id: 'ookina-furudokei',
    title: '大きな古時計',
    scoreFileName: '大きな古時計.json',
    instFileName: '大きな古時計.wav'
  },
  {
    id: defaultMemorizationSourceSongId,
    title: '幸せなら手をたたこう',
    scoreFileName: '幸せなら手をたたこう.json',
    instFileName: '幸せなら手をたたこう.wav'
  },
  {
    id: 'yuki',
    title: '雪',
    scoreFileName: '雪.json',
    instFileName: '雪.wav'
  }
] as const;

export function findMemorizationSourceSong(id?: string): MemorizationSourceSongAsset | undefined {
  return memorizationSourceSongs.find((song) => song.id === (id ?? defaultMemorizationSourceSongId));
}
