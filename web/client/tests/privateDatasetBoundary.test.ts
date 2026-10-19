import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { DatasetId, GeneratedTrackRecord, SolvedTask, SongDetail, SynthesisRequest } from '@shared/types';
import { checkVoicevox, previewLyrics, synthesizeSong } from '../src/lib/api';
import { checkDirectVoicevox, synthesizeDirectVoicevox } from '../src/lib/directVoicevox';
import { saveGeneratedTrack } from '../src/lib/historyDb';
import { openDB } from 'idb';
import { privateFetchOptions, privateSourceSong, voicevoxBaseUrlForDataset } from '../src/lib/localVoicevox';

vi.mock('idb', () => ({ openDB: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

const sourceSong = { id: 'choucho', scoreUrl: 'https://untrusted.invalid/score', instUrl: 'https://untrusted.invalid/inst' };
const song = { id: 'synthetic', mode: 'onomatopoeiaQuiz', sourceSong } as SongDetail;
const request: SynthesisRequest = { datasetId: 'browserImport', songId: 'synthetic', solvedTasks: [], fullLyrics: 'synthetic private text' };

describe('imported dataset privacy boundaries', () => {
  it.each(['http://localhost:50021', 'http://127.0.0.1:50021', 'http://[::1]:50021', 'http://localhost:50021/'])('allows the explicit local engine address %s', (url) => {
    expect(voicevoxBaseUrlForDataset(url, 'browserImport')).toBe(url.replace(/\/$/u, ''));
  });

  it.each([
    'https://localhost:50021', 'http://localhost:50022', 'http://localhost', 'http://localhost:50021/path',
    'http://localhost:50021?x=1', 'http://localhost:50021#fragment', 'http://user:pass@localhost:50021',
    'http://localhost.evil.invalid:50021', 'http://127.1:50021', 'http://2130706433:50021',
    'http://0x7f000001:50021', 'http://127.0.0.2:50021', 'http://[::ffff:127.0.0.1]:50021',
    'http://%6cocalhost:50021', 'http://192.168.0.1:50021', 'http://external.invalid:50021',
    ' http://localhost:50021', 'http://localhost:50021\n', 'http://localhost:50021\\external'
  ])('rejects noncanonical or external destinations before fetch: %s', async (url) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(checkDirectVoicevox(url, 'browserImport')).rejects.toThrow();
    await expect(synthesizeDirectVoicevox(song, [], url, 'browserImport')).rejects.toThrow();
    await expect(synthesizeSong({ ...request, voicevoxBaseUrl: url }, song, 'browserImport')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses only loopback for private version checks and refuses redirects/credentials/referrers', async () => {
    vi.stubGlobal('window', { setTimeout: vi.fn(), location: { hostname: 'external.invalid' } });
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify('synthetic-version'), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(checkVoicevox('http://127.0.0.1:50021', 'browserImport')).resolves.toMatchObject({ ok: true });
    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith('http://127.0.0.1:50021/version', expect.objectContaining(privateFetchOptions));
  });

  it('does not fall back to server APIs after a failed private engine check', async () => {
    vi.stubGlobal('window', { setTimeout: vi.fn(), location: { hostname: 'localhost' } });
    const fetchSpy = vi.fn(async () => { throw new TypeError('blocked redirect or connection'); });
    vi.stubGlobal('fetch', fetchSpy);
    await expect(checkVoicevox('http://localhost:50021', 'browserImport')).resolves.toMatchObject({ ok: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('http://localhost:50021/version');
  });

  it('sends private singing text only to the loopback engine and does not follow or fall back from a redirect failure', async () => {
    vi.stubGlobal('window', { setTimeout: vi.fn(), location: { hostname: 'public.invalid' } });
    const score = readFileSync(new URL('../../assets/score/ちょうちょ.json', import.meta.url), 'utf8');
    const tasks = Array.from({ length: 4 }, (_, index) => ({
      userInput: `synthetic-${index}`, singingReading: 'かくうのれいぶん', isCorrect: true
    })) as SolvedTask[];
    const fetchSpy = vi.fn(async (url: string, _options?: RequestInit) => {
      if (url.includes('assets/score/')) return new Response(score, { status: 200 });
      throw new TypeError('redirect rejected');
    });
    vi.stubGlobal('fetch', fetchSpy);
    await expect(synthesizeSong({ ...request, solvedTasks: tasks, voicevoxBaseUrl: 'http://localhost:50021' }, { ...song, title: 'オノマトペ' }, 'browserImport')).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]?.[0]).toBe('http://localhost:50021/sing_frame_audio_query?speaker=6000');
    expect(fetchSpy.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', ...privateFetchOptions });
    expect(fetchSpy.mock.calls.some(([url]) => url.includes('/api/'))).toBe(false);
  });

  it('blocks preview, mismatched provenance and unknown dataset IDs before side effects', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(previewLyrics('synthetic', [], 'browserImport')).rejects.toThrow();
    await expect(synthesizeSong(request, song, 'original335')).rejects.toThrow();
    await expect(checkDirectVoicevox('http://localhost:50021', undefined as unknown as DatasetId)).rejects.toThrow();
    await expect(saveGeneratedTrack({} as GeneratedTrackRecord, undefined as unknown as DatasetId)).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(openDB).not.toHaveBeenCalled();
  });

  it('derives private score and accompaniment URLs from bundled IDs, never imported metadata', () => {
    const urls = privateSourceSong(song);
    expect(urls.scoreUrl).toContain('assets/score/');
    expect(urls.instUrl).toContain('assets/inst/');
    expect(JSON.stringify(urls)).not.toContain('untrusted.invalid');
    expect(() => privateSourceSong({ ...song, sourceSong: { ...sourceSong, id: 'unknown' } } as SongDetail)).toThrow();
  });

  it('stores private history in IndexedDB with provenance and never makes network calls', async () => {
    const put = vi.fn(async () => undefined);
    vi.mocked(openDB).mockResolvedValue({ put } as never);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const record = { id: 'synthetic', lyrics: 'synthetic private text', voicevoxBaseUrl: 'http://localhost:50021' } as GeneratedTrackRecord;
    await saveGeneratedTrack(record, 'browserImport');
    expect(put).toHaveBeenCalledExactlyOnceWith('tracks', { ...record, datasetId: 'browserImport' });
    expect(fetchSpy).not.toHaveBeenCalled();
    await expect(saveGeneratedTrack({ ...record, datasetId: 'browserImport' }, 'original335')).rejects.toThrow();
  });
});
