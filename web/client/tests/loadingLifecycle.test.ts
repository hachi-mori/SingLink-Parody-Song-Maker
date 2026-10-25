// @vitest-environment jsdom
import { act, createElement, StrictMode, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SolvedTask, SongDetail } from '@shared/types';
import { LoadingScreen } from '../src/screens/LoadingScreen';
import { ResultScreen } from '../src/screens/ResultScreen';
import { synthesizeSong } from '../src/lib/api';
import { saveGeneratedTrack } from '../src/lib/historyDb';
import { buildSongKaraokeTimings } from '../src/lib/karaoke';
import type { GeneratedResult } from '../src/lib/generatedResult';

vi.mock('../src/lib/api', () => ({ synthesizeSong: vi.fn() }));
vi.mock('../src/lib/historyDb', () => ({ saveGeneratedTrack: vi.fn() }));
vi.mock('../src/lib/karaoke', () => ({ buildSongKaraokeTimings: vi.fn() }));
vi.mock('../src/lib/fileName', () => ({ buildGeneratedFileName: () => 'synthetic.wav', downloadBlob: vi.fn() }));
vi.mock('../src/lib/i18n', () => ({ useLanguage: () => ({ language: 'ja', t: (key: string) => key }) }));
vi.mock('../src/components/ScreenShell', () => ({ ScreenShell: ({ children }: { children: ReactNode }) => children }));
vi.mock('../src/components/SoundToggle', () => ({ SoundToggle: () => null }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const song: SongDetail = { id: 'synthetic', title: 'オノマトペ', mode: 'onomatopoeiaQuiz', vvprojFileName: '', vvprojUrl: '', problems: [] };
const tasks = Array.from({ length: 4 }, () => ({ singingReading: 'かくうのれいぶん', phrase: '合成', userInput: '合成', syllables: [], userSyllables: [] })) satisfies SolvedTask[];
const baseProps = { song, datasetId: 'browserImport' as const, tasks, fullLyrics: '合成例文', inputTexts: ['合成回答'], voicevoxBaseUrl: 'http://localhost:50021', voicevoxConnected: true, onBack: vi.fn() };
let root: Root | undefined;
let container: HTMLDivElement;
let audio: Blob;
let createObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  createObjectURL = vi.fn(() => 'blob:synthetic');
  vi.stubGlobal('URL', { createObjectURL });
  window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
  audio = new Blob(['synthetic-wav'], { type: 'audio/wav' });
  vi.mocked(synthesizeSong).mockResolvedValue(audio);
  vi.mocked(buildSongKaraokeTimings).mockResolvedValue([]);
  vi.mocked(saveGeneratedTrack).mockResolvedValue(undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) await act(async () => { root!.unmount(); });
  root = undefined;
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function show(onDone: (result: GeneratedResult) => void, props = baseProps, strict = false) {
  await act(async () => {
    const screen = createElement(LoadingScreen, { ...props, onDone });
    root!.render(strict ? createElement(StrictMode, null, screen) : screen);
  });
}

describe('loading lifecycle with real React effects', () => {
  it('finishes once under StrictMode without duplicate synthesis or history writes', async () => {
    const done = vi.fn();
    await show(done, baseProps, true);
    expect(synthesizeSong).toHaveBeenCalledTimes(1);
    expect(saveGeneratedTrack).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 'generated', blob: audio }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('survives callback and language-context rerenders while notifying the current callback', async () => {
    const pending = deferred<Blob>();
    vi.mocked(synthesizeSong).mockReturnValue(pending.promise);
    const oldDone = vi.fn();
    const newDone = vi.fn();
    await show(oldDone);
    await show(newDone);
    await act(async () => { pending.resolve(audio); });
    expect(synthesizeSong).toHaveBeenCalledTimes(1);
    expect(oldDone).not.toHaveBeenCalled();
    expect(newDone).toHaveBeenCalledTimes(1);
    expect(newDone.mock.calls[0]?.[0].status).toBe('generated');
  });

  it('supersedes a changed generation payload without delivering the stale result', async () => {
    const previous = deferred<Blob>();
    const next = deferred<Blob>();
    vi.mocked(synthesizeSong).mockReturnValueOnce(previous.promise).mockReturnValueOnce(next.promise);
    const done = vi.fn();
    await show(done);
    await show(done, { ...baseProps, fullLyrics: '別の合成例文' });
    await act(async () => { previous.resolve(audio); });
    expect(done).not.toHaveBeenCalled();
    expect(saveGeneratedTrack).not.toHaveBeenCalled();
    await act(async () => { next.resolve(audio); });
    expect(done).toHaveBeenCalledTimes(1);
    expect(saveGeneratedTrack).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lyrics: '別の合成例文' }), 'browserImport');
  });

  it('retains playable audio and a safe warning when history storage fails', async () => {
    vi.mocked(saveGeneratedTrack).mockRejectedValue(new Error('PRIVATE-SYNTHETIC-ERROR'));
    const done = vi.fn();
    await show(done);
    const result = done.mock.calls[0]?.[0] as GeneratedResult;
    expect(result).toMatchObject({ status: 'generated', blob: audio, blobUrl: 'blob:synthetic', historyWarning: expect.any(String) });
    expect(JSON.stringify(result)).not.toContain('PRIVATE-SYNTHETIC-ERROR');
    await act(async () => { root!.render(createElement(ResultScreen, { song, datasetId: 'browserImport', tasks, fullLyrics: baseProps.fullLyrics, result, onTitle: vi.fn(), onHistory: vi.fn() })); });
    expect(container.textContent).toContain('履歴への保存を確認できませんでした');
    expect(Array.from(container.querySelectorAll('button')).map(button => button.textContent)).toContain('play');
    expect(Array.from(container.querySelectorAll('button')).map(button => button.textContent)).toContain('download');
    expect(container.textContent).not.toContain('audioSkipped');
  });

  it('does not notify or write history after unmount while synthesis is pending', async () => {
    const pending = deferred<Blob>();
    vi.mocked(synthesizeSong).mockReturnValue(pending.promise);
    const done = vi.fn();
    await show(done);
    await act(async () => { root!.unmount(); root = undefined; });
    await act(async () => { pending.resolve(audio); });
    expect(done).not.toHaveBeenCalled();
    expect(saveGeneratedTrack).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not notify or create an object URL after unmount during history saving', async () => {
    const save = deferred<void>();
    vi.mocked(saveGeneratedTrack).mockReturnValue(save.promise);
    const done = vi.fn();
    await show(done);
    expect(saveGeneratedTrack).toHaveBeenCalledTimes(1);
    await act(async () => { root!.unmount(); root = undefined; });
    await act(async () => { save.resolve(); });
    expect(done).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['offline', 'missing-reading'])('finishes %s without starting synthesis', async (caseId) => {
    const done = vi.fn();
    await show(done, caseId === 'offline'
      ? { ...baseProps, voicevoxConnected: false }
      : { ...baseProps, tasks: [] });
    expect(done).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 'skipped' }));
    expect(synthesizeSong).not.toHaveBeenCalled();
    expect(saveGeneratedTrack).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out once and ignores late synthesis without writing history', async () => {
    const pending = deferred<Blob>();
    vi.mocked(synthesizeSong).mockReturnValue(pending.promise);
    const done = vi.fn();
    await show(done);
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
    expect(done).toHaveBeenCalledExactlyOnceWith({ status: 'skipped', message: 'generationTimeout' });
    await act(async () => { pending.resolve(audio); });
    expect(done).toHaveBeenCalledTimes(1);
    expect(saveGeneratedTrack).not.toHaveBeenCalled();
  });

  it('keeps generated audio when history saving has not settled by the timeout', async () => {
    const save = deferred<void>();
    vi.mocked(saveGeneratedTrack).mockReturnValue(save.promise);
    const done = vi.fn();
    await show(done);
    expect(done).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); });
    expect(done).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 'generated', blob: audio, historyWarning: expect.any(String) }));
    await act(async () => { save.resolve(); });
    expect(done).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh mount to retry after the previous attempt timed out', async () => {
    const stalled = deferred<Blob>();
    vi.mocked(synthesizeSong).mockReturnValueOnce(stalled.promise).mockResolvedValue(audio);
    const done = vi.fn();
    await show(done);
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000); root!.unmount(); });
    root = createRoot(container);
    await show(done);
    expect(done.mock.calls.map(([result]) => result.status)).toEqual(['skipped', 'generated']);
    expect(synthesizeSong).toHaveBeenCalledTimes(2);
    expect(saveGeneratedTrack).toHaveBeenCalledTimes(1);
    await act(async () => { stalled.resolve(audio); });
    expect(done).toHaveBeenCalledTimes(2);
  });
});
