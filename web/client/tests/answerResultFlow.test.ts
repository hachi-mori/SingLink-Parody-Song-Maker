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
  format: 'singlink-experience-set', version: 1, setId: 'synthetic-answer-flow', title: '架空の体験セット',
  entries: ['ああ', 'いい', 'うう', 'ええ'].map((answer, index) => ({
    id: `synthetic-${index}`, answer, explanation: '架空の意味',
    questionText: `架空の○○例文${index}。`, displayText: `架空の${answer}例文${index}。`,
    singingReading: 'かくうのれいぶん', choices: index === 0 ? ['おお', 'かか', answer] : index === 1 ? ['おお', answer, 'かか'] : [answer, 'おお', 'かか']
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
  api.synthesizeSong.mockResolvedValue(audio);
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


type InputMethod = 'click' | 'Enter' | ' ';

// jsdom does not perform a browser button's native keyboard default action.
// Model that action only if React's key handler has not cancelled the event.
async function activate(target: HTMLButtonElement, method: InputMethod = 'click') {
  if (method === 'click') return click(target);
  await act(async () => {
    target.focus();
    const down = new KeyboardEvent('keydown', { key: method, bubbles: true, cancelable: true });
    const accepted = target.dispatchEvent(down);
    if (accepted && method === 'Enter') target.click();
    const up = new KeyboardEvent('keyup', { key: method, bubbles: true, cancelable: true });
    if (target.dispatchEvent(up) && accepted && method === ' ') target.click();
  });
}

async function startRound(value: unknown = fixture) {
  const text = JSON.stringify(value);
  const file = new File([text], 'synthetic-answer-flow.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => text });
  await act(async () => {
    const input = host.querySelector<HTMLInputElement>('#dataset-file')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await click(button('スタート'));
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
}

function currentChoices() { return [...host.querySelectorAll<HTMLButtonElement>('.choice-grid button')]; }
function correctChoice(index: number) {
  return currentChoices().find(choice => choice.textContent?.trim().endsWith(fixture.entries[index]!.answer))!;
}
function resultCorrectness() {
  return [...host.querySelectorAll('.karaoke-line')].map(line => !line.querySelector('.karaoke-answer-status'));
}

async function answerRound(expected: boolean[], method: InputMethod = 'click') {
  for (let index = 0; index < 4; index++) {
    const entry = fixture.entries[index]!;
    expect(host.querySelector('.game-question-example')?.textContent).toBe(entry.questionText);
    expect(currentChoices().map(choice => choice.textContent?.trim()))
      .toEqual(entry.choices.map((choice, position) => String(position + 1) + ' ' + choice));
    const selected = expected[index] ? correctChoice(index) : currentChoices().find(choice => choice !== correctChoice(index))!;
    await activate(selected, method);
    expect(host.querySelector('.feedback-panel h2')?.textContent).toBe(expected[index] ? 'せいかい！' : 'ふせいかい');
    expect(sound.play).toHaveBeenLastCalledWith(expected[index] ? 'correct' : 'incorrect');
    await activate(button('つぎへ'), method);
  }
}

describe('accepted quiz answers stay aligned with generated lyric badges', () => {
  it.each(['click', 'Enter', ' '] as const)('keeps C/B/A/A all correct through App and ResultScreen (%s)', async method => {
    await startRound();
    await answerRound([true, true, true, true], method);
    expect(api.synthesizeSong).toHaveBeenCalledTimes(1);
    const request = api.synthesizeSong.mock.calls[0]![0];
    expect(request.solvedTasks.filter((task: { phrase: string }) => task.phrase).map((task: { isCorrect: boolean }) => task.isCorrect)).toEqual([true, true, true, true]);
    expect(resultCorrectness()).toEqual([true, true, true, true]);
    expect(host.querySelectorAll('.karaoke-answer-status')).toHaveLength(0);
    expect(history.saveGeneratedTrack.mock.calls[0]![0].userInputs.filter((_text: string, index: number) => index % 2 === 1)).toEqual(fixture.entries.map(entry => entry.answer));
  });

  it.each(Array.from({length:16}, (_value, mask) => mask))('keeps all four answer flags and badge positions for mask %i', async mask => {
    const expected = Array.from({length:4}, (_value, index) => Boolean(mask & (1 << index)));
    await startRound();
    await answerRound(expected);
    expect(resultCorrectness()).toEqual(expected);
    expect([...host.querySelectorAll('.karaoke-line .sr-only')].map(line => line.textContent)).toEqual(fixture.entries.map(entry => entry.displayText));
    const request = api.synthesizeSong.mock.calls[0]![0];
    const decoded = JSON.parse(JSON.stringify(request));
    expect(decoded.solvedTasks.filter((task: { phrase: string }) => task.phrase).map((task: { isCorrect: boolean }) => task.isCorrect)).toEqual(expected);
    expect(history.saveGeneratedTrack.mock.calls[0]![0].lyrics).toBe(fixture.entries.map(entry => entry.displayText).join('\n'));
  });

  it('keeps a timely correct answer when a later click, timeout, or duplicate Next follows', async () => {
    await startRound();
    for(let index=0; index<4; index++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(59_999); });
      const choices=currentChoices();
      await act(async () => { correctChoice(index).click(); choices.find(choice => choice!==correctChoice(index))!.click(); });
      expect(host.querySelector('.feedback-panel h2')?.textContent).toBe('せいかい！');
      await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
      expect(host.querySelector('.feedback-panel h2')?.textContent).toBe('せいかい！');
      const next=button('つぎへ');
      await act(async () => { next.click(); next.click(); });
      if(index<3) expect(host.querySelector('.game-hud strong')?.textContent).toBe('60');
    }
    expect(resultCorrectness()).toEqual([true,true,true,true]);
  });

  it('treats an answer arriving exactly at the deadline as timeout and keeps the following question independent', async () => {
    await startRound();
    await act(async () => { vi.setSystemTime(Date.now()+60_000); correctChoice(0).click(); });
    expect(host.querySelector('.feedback-panel h2')?.textContent).toBe('タイムアップ！');
    await click(button('つぎへ'));
    for(let index=1;index<4;index++) { await click(correctChoice(index)); await click(button('つぎへ')); }
    expect(resultCorrectness()).toEqual([false,true,true,true]);
  });

  it('prevents held Enter and Space from accepting the newly focused choice', async () => {
    await startRound();
    await activate(correctChoice(0),'Enter');
    await activate(button('つぎへ'),'Enter');
    for(const key of ['Enter',' ']) {
      await act(async () => {
        const event=new KeyboardEvent('keydown',{key,repeat:true,bubbles:true,cancelable:true});
        expect(currentChoices()[0]!.dispatchEvent(event)).toBe(false);
        if(!event.defaultPrevented) currentChoices()[0]!.click();
      });
    }
    expect(host.querySelector('.feedback-panel')).toBeNull();
    for(let index=1;index<4;index++) { await click(correctChoice(index)); await click(button('つぎへ')); }
    expect(resultCorrectness()).toEqual([true,true,true,true]);
  });

  it('retains recorded answers on the history screen without restoring or rejudging badges', async () => {
    await startRound();
    await answerRound([true,true,false,false]);
    expect(resultCorrectness()).toEqual([true,true,false,false]);
    const record=history.saveGeneratedTrack.mock.calls[0]![0];
    history.listGeneratedTracks.mockResolvedValue([record]);
    await click(button('保存した曲'));
    await act(async () => { host.querySelector<HTMLButtonElement>('.history-main')!.click(); });
    expect(host.querySelector('.history-detail pre')?.textContent).toBe(record.lyrics);
    expect(host.querySelector('.karaoke-answer-status')).toBeNull();
    expect(history.deleteGeneratedTrack).not.toHaveBeenCalled();
  });
});
