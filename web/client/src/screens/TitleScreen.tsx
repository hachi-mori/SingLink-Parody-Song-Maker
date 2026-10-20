import { RefreshCw } from 'lucide-react';
import type { DatasetId, QuizDataset, SongInfo, SourceSongInfo, VoicevoxVersionResponse } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { SoundToggle } from '../components/SoundToggle';
import { assetUrl } from '../lib/assets';
import { useLanguage } from '../lib/i18n';

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
  const { t } = useLanguage();
  const privateMode = props.selectedDatasetId === 'browserImport';
  const statusClass = props.voicevoxStatus?.ok ? 'status-ok' : 'status-warn';

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/title_background.png')} fit="cover">
      <section className="title-layout">
        <div className="title-main">
          <img className="title-logo" src={assetUrl('assets/texture/assets/title_logo_trimmed.png')} alt="シングリンク" />
          <div className="song-picker">
            <div className="song-picker-row">
              <label htmlFor="dataset-select">教材</label>
              <select
                id="dataset-select"
                value={props.selectedDatasetId}
                disabled={props.loading}
                onChange={(event) => props.onSelectDataset(event.target.value as DatasetId)}
              >
                {props.datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>{dataset.label}</option>
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
                    {song.title}
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
                    {song.title}
                  </option>
                ))}
              </select>
            </div>
            {props.error ? <p className="error-text" role="alert">{props.error}</p> : null}
          </div>

          <nav className="title-actions" aria-label={t('titleMenu')}>
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/start.png')} label={t('start')} onClick={props.onStart} disabled={props.loading} />
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/howtoplay.png')} label={t('howTo')} onClick={props.onOpenHowTo} />
            <button className="history-button" onClick={props.onOpenHistory}>{t('savedSongs')}</button>
            <button className="credit-link" onClick={props.onOpenCredit}>{t('credits')}</button>
          </nav>

          <SoundToggle />
          <div className="title-settings">
            <section className="dataset-import-panel" aria-label="教材の読み込み">
              <label htmlFor="dataset-file">教材を読み込む</label>
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
              {props.importedEntryCount !== undefined ? <>
                <p role="status">{`${props.importedEntryCount}問を読み込みました`}</p>
                <p>{`歌える問題：${props.importedSingingReadingCount ?? 0} / ${props.importedEntryCount}問`}</p>
                {props.importedSingingReadingCount !== props.importedEntryCount ? <p>歌えない問題もあります</p> : null}
                <button className="small-button" onClick={props.onClearImportedDataset}>もとの教材にもどす</button>
              </> : null}
            </section>
            <section className="voicevox-panel" aria-label="VOICEVOXの接続">
              <div className={statusClass} role="status">{props.voicevoxStatus
                ? props.voicevoxStatus.ok
                  ? t('voicevoxConnected', { version: props.voicevoxStatus.version ? ` (${props.voicevoxStatus.version})` : '' })
                  : 'VOICEVOXにつながっていません'
                : 'VOICEVOXをまだ確認していません'}</div>
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
                <RefreshCw size={16} aria-hidden="true" />
                つながるか確認
              </button>
            </section>
          </div>
        </div>
      </section>
    </ScreenShell>
  );
}
