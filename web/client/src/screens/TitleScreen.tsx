import { RefreshCw } from 'lucide-react';
import type { DatasetId, QuizDataset, SongInfo, SourceSongInfo, VoicevoxVersionResponse } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import { useLanguage } from '../lib/i18n';
import { localVoicevoxNotice, privateDatasetNotice } from '../lib/quizDatasets';

const englishSongNames: Record<string, string> = {
  'オノマトペ': 'Onomatopoeia',
  '幸せなら手をたたこう': "If You're Happy and You Know It",
  'ちょうちょ': 'Butterfly',
  'むすんでひらいて': 'Close and Open',
  '大きな古時計': 'My Grandfather’s Clock',
  '雪': 'Snow'
};

type TitleScreenProps = {
  songs: SongInfo[];
  datasets: QuizDataset[];
  selectedDatasetId: DatasetId;
  importedEntryCount?: number;
  importedSingingReadingCount?: number;
  onImportDataset: (file: File) => Promise<void>;
  onClearImportedDataset: () => void;
  selectedSongId: string;
  sourceSongs: SourceSongInfo[];
  selectedSourceSongId: string;
  sourceSelectionEnabled: boolean;
  voicevoxBaseUrl: string;
  voicevoxStatus?: VoicevoxVersionResponse;
  loading: boolean;
  error?: string;
  onSelectSong: (songId: string) => void;
  onSelectDataset: (datasetId: DatasetId) => void;
  onSelectSourceSong: (songId: string) => void;
  onBaseUrlChange: (baseUrl: string) => void;
  onCheckVoicevox: () => void;
  onStart: () => void;
  onOpenHowTo: () => void;
  onOpenCredit: () => void;
  onOpenHistory: () => void;
};

export function TitleScreen(props: TitleScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const privateMode = props.selectedDatasetId === 'browserImport';
  const statusClass = props.voicevoxStatus?.ok ? 'status-ok' : 'status-warn';
  const displaySong = (title: string) => language === 'en' && englishSongNames[title]
    ? `${title} (${englishSongNames[title]})`
    : title;

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/title_background.png')} fit="cover">
      <section className="title-layout">
        <div className="title-settings">
          <div className="voicevox-panel">
            <div className={statusClass}>{props.voicevoxStatus
              ? props.voicevoxStatus.ok
                ? t('voicevoxConnected', { version: props.voicevoxStatus.version ? ` (${props.voicevoxStatus.version})` : '' })
                : t('voicevoxDisconnected')
              : t('voicevoxLocalNotChecked')}</div>
            <label>
              <span>{t('voicevoxUrl')}</span>
              <input
                value={props.voicevoxBaseUrl}
                disabled={props.loading}
                onChange={(event) => props.onBaseUrlChange(event.target.value)}
                onBlur={props.onCheckVoicevox}
              />
            </label>
            <button className="small-button" onClick={props.onCheckVoicevox} disabled={props.loading}>
              <RefreshCw size={16} />
              {privateMode ? 'このPCのVOICEVOXへ接続' : t('recheck')}
            </button>
            {privateMode ? <small>{localVoicevoxNotice}</small> : null}
          </div>
          <label className="language-panel">
            <span>{t('language')}</span>
            <select value={language} disabled={privateMode} onChange={(event) => setLanguage(event.target.value as 'en' | 'ja')}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
        </div>

        <button className="credit-link" onClick={props.onOpenCredit}>{t('credits')}</button>

        <div className="title-main">
          <img className="title-logo" src={assetUrl('assets/texture/assets/title_logo.png')} alt="シングリンク" />
          <div className="song-picker">
            <section className="dataset-import-panel" aria-label={language === 'en' ? 'Local learning material' : 'ローカル教材'}>
              <p>{language === 'en' ? 'Included: 335 original questions' : '同梱教材：自作335問'}</p>
              <label htmlFor="dataset-file">{language === 'en' ? 'Import learning JSON' : '教材JSONを読み込む'}</label>
              <input
                id="dataset-file"
                type="file"
                accept=".json,application/json"
                disabled={props.loading}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (file) void props.onImportDataset(file);
                }}
              />
              <small>{language === 'en'
                ? 'JSON only · up to 2 MiB · 4–1000 unique answers. Legacy records with optional readings, or entries with answer, explanation and questionText (○○ blank). Add singingReading to sing.'
                : 'JSON・2 MiB以下・異なる答え4〜1000件。旧records＋readings、またはentries（answer・explanation・○○を含むquestionText）に対応。歌声生成には歌唱読み（singingReading）が必要です。'}</small>
              <p className="dataset-privacy-notice">{language === 'en'
                ? 'Imported questions stay in this tab. Singing sends text only to VOICEVOX on this PC, and generated audio and lyrics are saved in this browser’s history. No external server, cloud AI, analytics or sync. Clear/reload removes the question set; delete saved songs separately in History.'
                : privateDatasetNotice}</p>
              <small>{language === 'en'
                ? 'The browser may request local-network permission to connect to VOICEVOX. Only http://localhost:50021, http://127.0.0.1:50021 or http://[::1]:50021 are allowed; redirects and external fallbacks are blocked.'
                : localVoicevoxNotice}</small>
              {props.importedEntryCount !== undefined ? <>
                <p role="status">{language === 'en' ? `${props.importedEntryCount} questions loaded in this tab` : `このタブに${props.importedEntryCount}問を読み込みました`}</p>
                <p>{`歌唱読み：${props.importedSingingReadingCount ?? 0} / ${props.importedEntryCount}問。${props.importedSingingReadingCount === props.importedEntryCount ? 'このPCのVOICEVOXで歌声を作れます。' : '読みのない問題を含む回は音声なしで結果を表示します。'}`}</p>
                <button className="small-button" onClick={props.onClearImportedDataset}>{language === 'en' ? 'Clear imported material' : '読み込んだ教材を解除'}</button>
              </> : null}
            </section>
            <div className="song-picker-row">
              <label htmlFor="dataset-select">{language === 'en' ? 'Learning set' : '教材'}</label>
              <select
                id="dataset-select"
                value={props.selectedDatasetId}
                disabled={props.loading}
                onChange={(event) => props.onSelectDataset(event.target.value as DatasetId)}
              >
                {props.datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>{language === 'en' && dataset.id === 'original335' ? '335 original questions' : dataset.label}</option>
                ))}
              </select>
            </div>
            <div className="song-picker-row">
              <label htmlFor="song-select">{t('quizType')}</label>
              <select
                id="song-select"
                value={props.selectedSongId}
                disabled={props.loading || privateMode}
                onChange={(event) => props.onSelectSong(event.target.value)}
              >
                <option value="">{t('chooseQuiz')}</option>
                {props.songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {displaySong(song.title)}
                  </option>
                ))}
              </select>
            </div>
            <div className="song-picker-row">
              <label htmlFor="source-song-select">{t('sourceSong')}</label>
              <select
                id="source-song-select"
                value={props.selectedSourceSongId}
                disabled={!props.sourceSelectionEnabled || props.loading}
                onChange={(event) => props.onSelectSourceSong(event.target.value)}
              >
                {props.sourceSongs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {displaySong(song.title)}
                  </option>
                ))}
              </select>
              <small>{props.sourceSelectionEnabled ? t('sourceSongHelp') : t('sourceSongDisabled')}</small>
            </div>
            {props.error ? <p className="error-text" role="alert">{props.error}</p> : null}
          </div>

          <nav className="title-actions" aria-label={t('titleMenu')}>
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/start.png')} label={t('start')} onClick={props.onStart} disabled={props.loading} />
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/howtoplay.png')} label={t('howTo')} onClick={props.onOpenHowTo} />
            <button className="history-button" onClick={props.onOpenHistory}>{t('savedSongs')}</button>
          </nav>
        </div>
      </section>
    </ScreenShell>
  );
}
