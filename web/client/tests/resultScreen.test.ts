import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SongDetail } from '@shared/types';
import { ResultScreen } from '../src/screens/ResultScreen';
import { LanguageProvider } from '../src/lib/i18n';
import type { GeneratedResult } from '../src/lib/generatedResult';

afterEach(() => vi.unstubAllGlobals());

function renderResult(result: GeneratedResult) {
  vi.stubGlobal('window', {
    localStorage: { getItem: () => 'ja' },
    matchMedia: () => ({ matches: false })
  });
  const song: SongDetail = {
    id: 'synthetic', title: '架空の曲', mode: 'onomatopoeiaQuiz',
    vvprojFileName: '', vvprojUrl: '', problems: []
  };
  return renderToStaticMarkup(createElement(LanguageProvider, null,
    createElement(ResultScreen, {
      song, datasetId: 'original335', tasks: [], fullLyrics: '架空の例文。', result,
      onTitle: () => undefined, onHistory: () => undefined
    })
  ));
}

describe('result screen reports available playback accurately', () => {
  it('labels a skipped result as a quiz result, without claiming karaoke or playback', () => {
    const markup = renderResult({ status: 'skipped', message: '検証用の音声なし結果' });
    expect(markup).toContain('<h1>クイズの結果</h1>');
    expect(markup).not.toContain('result-song-source');
    expect(markup).toContain('result-layout--no-audio');
    expect(markup).not.toContain('歌っています');
    expect(markup).not.toContain('カラオケで復習');
    expect(markup).not.toContain('result-playback-status');
  });

  it('labels generated audio as ready before the user starts it', () => {
    const markup = renderResult({
      status: 'generated', source: 'live', blob: new Blob(), blobUrl: 'blob:synthetic',
      fileName: 'synthetic.wav', karaokeTimings: []
    });
    expect(markup).toContain('<h1>「架空の曲」の歌</h1>');
    expect(markup).toContain('role="status">再生できます</p>');
    expect(markup).not.toContain('歌っています');
    expect(markup).not.toContain('result-layout--no-audio');
  });
});
