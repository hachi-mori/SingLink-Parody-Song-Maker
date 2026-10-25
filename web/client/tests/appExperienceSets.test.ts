// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { OnomatopoeiaEntry, SongDetail, SongInfo } from '@shared/types';
import { App } from '../src/App';
import { LanguageProvider } from '../src/lib/i18n';
import * as quizSelection from '../src/lib/quizSelection';

const api = vi.hoisted(() => ({
  fetchSongs: vi.fn(), fetchSongDetail: vi.fn(), checkVoicevox: vi.fn(),
  synthesizeSong: vi.fn(), previewLyrics: vi.fn()
}));
const history = vi.hoisted(() => ({
  saveGeneratedTrack: vi.fn(), listGeneratedTracks: vi.fn(), deleteGeneratedTrack: vi.fn()
}));
const sound = vi.hoisted(() => ({ enabled: false, toggle: vi.fn(), play: vi.fn() }));
vi.mock('../src/lib/api', () => api);
vi.mock('../src/lib/historyDb', () => history);
vi.mock('../src/lib/soundEffectsContext', () => ({ useSoundEffects: () => sound }));
vi.mock('../src/lib/demo', () => ({ loadDemoBundle: vi.fn() }));

// All teaching text is synthetic. App, TitleScreen, the importer and the quiz
// screen are real; only network, audio and history boundaries are mocked.
function fixedSet(name: 'A' | 'B') {
  const answers = name === 'A' ? ['ああ', 'いい', 'うう', 'ええ'] : ['かか', 'きき', 'くく', 'けけ'];
  return {
    format: 'singlink-experience-set', version: 1, setId: `fixture-${name}`, title: `架空セット${name}`,
    entries: answers.map((answer, index) => ({
      id: `fixture-${name}-${index}`, answer, explanation: `架空の意味${name}-${index}`,
      questionText: `架空${name} ○○ の例文${index + 1}。`,
      displayText: `架空${name} ${answer} の例文${index + 1}。`,
      singingReading: 'かくうのれいぶん', choices: ['ささ', answer, 'しし']
    }))
  };
}

const songInfo: SongInfo = {
  id: 'synthetic-quiz', title: '架空のオノマトペクイズ', mode: 'onomatopoeiaQuiz',
  vvprojFileName: 'synthetic.vvproj', vvprojUrl: '/synthetic.vvproj'
};
const publicEntries: OnomatopoeiaEntry[] = Array.from({ length: 335 }, (_, index) => ({
  word: `public-${index}`, reading: `public-${index}`, answer: `public-${index}`,
  explanation: `架空の公開教材の意味${index}`,
  questionText: `架空の公開教材 ○○ の例文${index}。`,
  displayText: `架空の公開教材 public-${index} の例文${index}。`, singingReading: 'かくうのれいぶん'
}));
const publicSong: SongDetail = { ...songInfo, problems: [], onomatopoeiaEntries: publicEntries };

let host: HTMLDivElement;
let root: Root | undefined;
let network: ReturnType<typeof vi.fn>;
let databaseOpen: ReturnType<typeof vi.fn>;

function element<T extends Element>(selector: string): T {
  const result = host.querySelector<T>(selector);
  if (!result) throw new Error(`Expected rendered element: ${selector}`);
  return result;
}
function button(name: string): HTMLButtonElement {
  const result = [...host.querySelectorAll('button')].find((candidate) =>
    (candidate.getAttribute('aria-label') ?? candidate.textContent?.trim()) === name);
  if (!result) throw new Error(`Expected rendered button: ${name}`);
  return result;
}
async function click(target: HTMLButtonElement) {
  await act(async () => { target.click(); });
}
async function select(selector: string, value: string) {
  await act(async () => {
    const target = element<HTMLSelectElement>(selector);
    target.value = value;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
async function mountApp() {
  root = createRoot(host);
  await act(async () => { root!.render(createElement(LanguageProvider, null, createElement(App))); });
  expect(element<HTMLSelectElement>('#song-select').options).toHaveLength(2);
}
async function importFile(value: unknown, name = 'synthetic-set.json') {
  const text = JSON.stringify(value);
  const file = new File([text], name, { type: 'application/json' });
  // jsdom File has bytes, name, type and size but no Blob.text implementation.
  // Provide the browser API on this synthetic File; do not mock the importer.
  Object.defineProperty(file, 'text', { value: async () => text });
  await act(async () => {
    const input = element<HTMLInputElement>('#dataset-file');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(element<HTMLInputElement>('#dataset-file').disabled).toBe(false);
}
async function startQuiz() {
  await click(button('スタート'));
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(host.querySelector('.game-question-example')).not.toBeNull();
}
function expectFixedQuestion(value: ReturnType<typeof fixedSet>, index = 0) {
  const expected = value.entries[index]!;
  expect(element('.game-question-example').textContent).toBe(expected.questionText);
  expect([...host.querySelectorAll('.choice-grid button')].map((choice) => choice.textContent?.trim()))
    .toEqual(expected.choices.map((choice, position) => `${position + 1} ${choice}`));
  expect(element('.game-hud').textContent).toContain(`${value.title} · ${index + 1} / 4`);
}
function expectImportedTitle(value: ReturnType<typeof fixedSet>) {
  const datasets = element<HTMLSelectElement>('#dataset-select');
  expect(datasets.value).toBe('browserImport');
  expect(datasets.selectedOptions[0]?.textContent).toBe(value.title);
  expect(element('.dataset-import-panel [role="status"]').textContent).toBe(`${value.title}：4問を読み込みました`);
  expect(element('.dataset-import-panel').textContent).toContain('問題と選択肢は固定です。');
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  network = vi.fn(() => { throw new Error('Unexpected network access in App integration test'); });
  databaseOpen = vi.fn(() => { throw new Error('Unexpected IndexedDB access in App integration test'); });
  vi.stubGlobal('fetch', network);
  vi.stubGlobal('indexedDB', { open: databaseOpen });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  api.fetchSongs.mockResolvedValue([songInfo]);
  api.fetchSongDetail.mockResolvedValue(publicSong);
  api.checkVoicevox.mockResolvedValue({ ok: false, message: 'Synthetic offline status' });
  host = document.createElement('div');
  document.body.append(host);
  await mountApp();
});

afterEach(async () => {
  if (root) await act(async () => { root!.unmount(); });
  root = undefined;
  host.remove();
  expect(network).not.toHaveBeenCalled();
  expect(databaseOpen).not.toHaveBeenCalled();
  expect(history.saveGeneratedTrack).not.toHaveBeenCalled();
  expect(history.listGeneratedTracks).not.toHaveBeenCalled();
  expect(history.deleteGeneratedTrack).not.toHaveBeenCalled();
  expect(api.synthesizeSong).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('App experience-set import and selection lifecycle', () => {
  it('loads a synthetic File through the real title and advances fixed questions and choices in the real quiz', async () => {
    const a = fixedSet('A');
    await importFile(a);
    expectImportedTitle(a);
    await startQuiz();
    expectFixedQuestion(a);
    await click(element<HTMLButtonElement>('.choice-grid button:nth-child(2)'));
    expect(element('.feedback-panel h2').textContent).toBe('せいかい！');
    await click(button('つぎへ'));
    expectFixedQuestion(a, 1);
    expect(api.fetchSongDetail).not.toHaveBeenCalled();
  });

  it('replaces A with B and starts B at question one without A answers or round state', async () => {
    const a = fixedSet('A');
    const b = fixedSet('B');
    await importFile(a, 'A.json');
    await startQuiz();
    await click(element<HTMLButtonElement>('.choice-grid button:nth-child(1)'));
    expect(element('.feedback-panel h2').textContent).toBe('ふせいかい');
    await click(button('つぎへ'));
    expectFixedQuestion(a, 1);
    await click(button('タイトルへ'));
    await importFile(b, 'B.json');
    expectImportedTitle(b);
    expect(host.textContent).not.toContain(a.title);
    await startQuiz();
    expectFixedQuestion(b);
    expect(host.querySelector('.feedback-panel')).toBeNull();
    expect(api.fetchSongDetail).not.toHaveBeenCalled();
  });

  it.each([
    ['answer absent from choices', (value: ReturnType<typeof fixedSet>) => { value.entries[0]!.choices[1] = 'すす'; }],
    ['duplicate choices', (value: ReturnType<typeof fixedSet>) => { value.entries[0]!.choices[2] = value.entries[0]!.choices[0]!; }],
    ['fewer than four questions', (value: ReturnType<typeof fixedSet>) => { value.entries.pop(); }]
  ] as const)('keeps the previous complete set after an invalid File: %s', async (_name, mutate) => {
    const b = fixedSet('B');
    await importFile(b, 'valid-B.json');
    const invalid = fixedSet('A');
    mutate(invalid);
    await importFile(invalid, 'invalid-A.json');
    expect(element('[role="alert"]').textContent).toContain('教材JSONの形式が正しくありません');
    expectImportedTitle(b);
    await startQuiz();
    expectFixedQuestion(b);
  });

  it('uses the normal 335-entry flow without fixed-set data, then can reselect the preserved imported set', async () => {
    const b = fixedSet('B');
    await importFile(b);
    await select('#dataset-select', 'original335');
    const selection = vi.spyOn(quizSelection, 'selectOnomatopoeiaQuestions');
    await startQuiz();
    expect(api.fetchSongDetail).toHaveBeenCalledExactlyOnceWith(songInfo.id);
    const activeSong = selection.mock.calls.at(-1)?.[0];
    expect(activeSong?.experienceSet).toBeUndefined();
    expect(activeSong?.onomatopoeiaEntries).toHaveLength(335);
    expect(activeSong?.onomatopoeiaEntries?.every((entry) => entry.choices === undefined)).toBe(true);
    expect(element('.game-question-example').textContent).toContain('架空の公開教材');
    expect(element('.game-hud').textContent).not.toContain(b.title);
    await click(button('タイトルへ'));
    await select('#dataset-select', 'browserImport');
    await startQuiz();
    expectFixedQuestion(b);
    expect(api.fetchSongDetail).toHaveBeenCalledTimes(1);
  });

  it('clears the imported material with the real restore-original button', async () => {
    await importFile(fixedSet('A'));
    await click(button('もとの教材にもどす'));
    const datasets = element<HTMLSelectElement>('#dataset-select');
    expect(datasets.value).toBe('original335');
    expect([...datasets.options].map((option) => option.value)).toEqual(['original335']);
    expect(host.querySelector('.dataset-import-panel [role="status"]')).toBeNull();
    expect(host.textContent).not.toContain('架空セットA');
    await startQuiz();
    expect(element('.game-question-example').textContent).toContain('架空の公開教材');
  });

  it('discards imported material on unmount/remount while leaving only the original dataset available', async () => {
    await importFile(fixedSet('B'));
    expect(element('.dataset-import-panel').textContent).toContain('ページを更新したら、教材を読み直してください。');
    await act(async () => { root!.unmount(); });
    root = undefined;
    await mountApp();
    const datasets = element<HTMLSelectElement>('#dataset-select');
    expect(datasets.value).toBe('original335');
    expect([...datasets.options].map((option) => option.value)).toEqual(['original335']);
    expect(host.querySelector('.dataset-import-panel [role="status"]')).toBeNull();
    expect(host.textContent).not.toContain('架空セットB');
    expect(element<HTMLSelectElement>('#song-select').value).toBe('');
  });
});
