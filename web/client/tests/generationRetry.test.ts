// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { LanguageProvider } from '../src/lib/i18n';

const api = vi.hoisted(() => ({ fetchSongs: vi.fn(), fetchSongDetail: vi.fn(), checkVoicevox: vi.fn(), synthesizeSong: vi.fn(), previewLyrics: vi.fn() }));
const history = vi.hoisted(() => ({ saveGeneratedTrack: vi.fn(), listGeneratedTracks: vi.fn(), deleteGeneratedTrack: vi.fn() }));
const timings = vi.hoisted(() => ({ buildSongKaraokeTimings: vi.fn() }));
const sound = vi.hoisted(() => ({ enabled: false, toggle: vi.fn(), play: vi.fn() }));
vi.mock('../src/lib/api', () => api);
vi.mock('../src/lib/historyDb', () => history);
vi.mock('../src/lib/karaoke', () => timings);
vi.mock('../src/lib/soundEffectsContext', () => ({ useSoundEffects: () => sound }));
vi.mock('../src/lib/demo', () => ({ loadDemoBundle: vi.fn() }));

// The complete App/quiz/loading/result flow is real. Data is synthetic and all
// network, audio generation and history storage boundaries are mocked.
const fixture = {
  format: 'singlink-experience-set', version: 1, setId: 'synthetic-retry', title: '架空の体験セット',
  entries: ['ああ', 'いい', 'うう', 'ええ'].map((answer, index) => ({
    id: `synthetic-${index}`, answer, explanation: '架空の意味',
    questionText: `架空の○○例文${index}。`, displayText: `架空の${answer}例文${index}。`,
    singingReading: 'かくうのれいぶん', choices: ['おお', answer, 'かか']
  }))
};
let host: HTMLDivElement;
let root: Root;
let network: ReturnType<typeof vi.fn>;
let databaseOpen: ReturnType<typeof vi.fn>;
let audio: Blob;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}
function button(label: string) {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => (item.getAttribute('aria-label') ?? item.textContent?.trim()) === label);
  if (!match) throw new Error(`Missing test button: ${label}`);
  return match;
}
async function click(target: HTMLButtonElement) {
  await act(async () => { target.click(); });
}
async function finishQuiz() {
  const text = JSON.stringify(fixture);
  const file = new File([text], 'synthetic-retry.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => text });
  await act(async () => {
    const input = host.querySelector<HTMLInputElement>('#dataset-file')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await click(button('スタート'));
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  for (let index = 0; index < 4; index++) {
    const choices = host.querySelectorAll<HTMLButtonElement>('.choice-grid button');
    await click(choices[index % 2 === 0 ? 1 : 0]!);
    await click(button('つぎへ'));
  }
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  network = vi.fn(() => { throw new Error('Unexpected network access'); });
  databaseOpen = vi.fn(() => { throw new Error('Unexpected actual history access'); });
  vi.stubGlobal('fetch', network);
  vi.stubGlobal('indexedDB', { open: databaseOpen });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:synthetic-retry'), revokeObjectURL: vi.fn() });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  audio = new Blob(['synthetic-wav'], { type: 'audio/wav' });
  api.fetchSongs.mockResolvedValue([{ id: 'synthetic', title: 'オノマトペ', mode: 'onomatopoeiaQuiz', vvprojFileName: 'synthetic.vvproj', vvprojUrl: '/synthetic.vvproj' }]);
  api.checkVoicevox.mockResolvedValue({ ok: true, baseUrl: 'http://localhost:50021', message: 'Synthetic connected status' });
  api.synthesizeSong.mockRejectedValueOnce(new Error('Synthetic generation failed')).mockResolvedValue(audio);
  timings.buildSongKaraokeTimings.mockResolvedValue([]);
  history.saveGeneratedTrack.mockResolvedValue(undefined);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(createElement(LanguageProvider, null, createElement(App))); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  expect(network).not.toHaveBeenCalled();
  expect(databaseOpen).not.toHaveBeenCalled();
  expect(history.deleteGeneratedTrack).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('retrying audio for the same completed quiz', () => {
  it('rechecks the local connection and regenerates the same four answers after synthesis failure', async () => {
    await finishQuiz();
    expect(host.querySelector('.result-notice')?.textContent).toContain('Synthetic generation failed');
    const originalRequest = api.synthesizeSong.mock.calls[0]![0];
    expect(originalRequest.solvedTasks.filter((task: { singingReading?: string }) => task.singingReading)).toHaveLength(4);
    const checks = api.checkVoicevox.mock.calls.length;
    await click(button('歌を作り直す'));
    expect(api.checkVoicevox).toHaveBeenCalledTimes(checks + 1);
    expect(api.checkVoicevox).toHaveBeenLastCalledWith('http://localhost:50021', 'browserImport');
    expect(api.synthesizeSong).toHaveBeenCalledTimes(2);
    expect(api.synthesizeSong.mock.calls[1]![0]).toEqual(originalRequest);
    expect(api.synthesizeSong.mock.calls[1]![1]).toBe(api.synthesizeSong.mock.calls[0]![1]);
    expect(history.saveGeneratedTrack).toHaveBeenCalledTimes(1);
    expect(button('再生')).toBeTruthy();
    expect(button('ダウンロード')).toBeTruthy();
    expect(host.querySelector('.game-question-example')).toBeNull();
  });

  it('allows only one retry while reconnection is pending', async () => {
    await finishQuiz();
    const pending = deferred<{ ok: boolean; message: string; baseUrl: string }>();
    api.checkVoicevox.mockReturnValueOnce(pending.promise);
    const checks = api.checkVoicevox.mock.calls.length;
    const retry = button('歌を作り直す');
    await act(async () => { retry.click(); retry.click(); });
    expect(api.checkVoicevox).toHaveBeenCalledTimes(checks + 1);
    expect(button('接続を確認中…').disabled).toBe(true);
    await act(async () => { pending.resolve({ ok: true, baseUrl: 'http://localhost:50021', message: 'Synthetic connected status' }); });
    expect(api.synthesizeSong).toHaveBeenCalledTimes(2);
    expect(history.saveGeneratedTrack).toHaveBeenCalledTimes(1);
  });

  it('ignores a late reconnection after returning to the title', async () => {
    await finishQuiz();
    const pending = deferred<{ ok: boolean; message: string; baseUrl: string }>();
    api.checkVoicevox.mockReturnValueOnce(pending.promise);
    await click(button('歌を作り直す'));
    await click(button('タイトルへ'));
    await act(async () => { pending.resolve({ ok: true, baseUrl: 'http://localhost:50021', message: 'Synthetic connected status' }); });
    expect(host.querySelector('#dataset-select')).not.toBeNull();
    expect(host.querySelector('.loading-panel')).toBeNull();
    expect(api.synthesizeSong).toHaveBeenCalledTimes(1);
    expect(history.saveGeneratedTrack).not.toHaveBeenCalled();
  });

  it('ignores an older import connection check after retry has confirmed a new connection', async () => {
    const oldCheck = deferred<{ ok: boolean; message: string; baseUrl: string }>();
    api.checkVoicevox.mockReturnValueOnce(oldCheck.promise);
    await finishQuiz();
    const regenerated = deferred<Blob>();
    api.synthesizeSong.mockReturnValueOnce(regenerated.promise);
    await click(button('歌を作り直す'));
    await act(async () => { oldCheck.resolve({ ok: false, baseUrl: 'http://localhost:50021', message: 'Old synthetic offline result' }); });
    await act(async () => { regenerated.resolve(audio); });
    expect(api.synthesizeSong).toHaveBeenCalledTimes(2);
    expect(button('再生')).toBeTruthy();
    expect(history.saveGeneratedTrack).toHaveBeenCalledTimes(1);
  });

  it('keeps retry available after reconnection fails and then succeeds on a later attempt', async () => {
    await finishQuiz();
    api.checkVoicevox.mockRejectedValueOnce(new Error('Synthetic connection failure'));
    await click(button('歌を作り直す'));
    expect(button('歌を作り直す').disabled).toBe(false);
    expect(host.querySelector('.result-notice')?.textContent).toContain('VOICEVOXを確認できませんでした。');
    expect(api.synthesizeSong).toHaveBeenCalledTimes(1);
    await click(button('歌を作り直す'));
    expect(api.synthesizeSong).toHaveBeenCalledTimes(2);
    expect(button('再生')).toBeTruthy();
  });
});
