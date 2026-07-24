import { describe, expect, it } from 'vitest';
import {
  defaultMemorizationSourceSongId,
  findMemorizationSourceSong,
  memorizationSourceSongs
} from '../src/memorizationSongs';

describe('memorization source songs', () => {
  it('旧アプリの5曲を固定順で公開する', () => {
    expect(memorizationSourceSongs.map((song) => song.title)).toEqual([
      'ちょうちょ',
      'むすんでひらいて',
      '大きな古時計',
      '幸せなら手をたたこう',
      '雪'
    ]);
    expect(new Set(memorizationSourceSongs.map((song) => song.id)).size).toBe(5);
    expect(new Set(memorizationSourceSongs.map((song) => song.scoreFileName)).size).toBe(5);
    expect(new Set(memorizationSourceSongs.map((song) => song.instFileName)).size).toBe(5);
  });

  it('未指定時は従来曲を選び不正IDは受け付けない', () => {
    expect(findMemorizationSourceSong()?.id).toBe(defaultMemorizationSourceSongId);
    expect(findMemorizationSourceSong('yuki')?.title).toBe('雪');
    expect(findMemorizationSourceSong('unknown')).toBeUndefined();
  });
});
