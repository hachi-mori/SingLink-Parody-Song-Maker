import { RefreshCw } from 'lucide-react';
import type { SongInfo, SourceSongInfo, VoicevoxVersionResponse } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import { useLanguage } from '../lib/i18n';

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
  selectedSongId: string;
  sourceSongs: SourceSongInfo[];
  selectedSourceSongId: string;
  sourceSelectionEnabled: boolean;
  voicevoxBaseUrl: string;
  voicevoxStatus?: VoicevoxVersionResponse;
  loading: boolean;
  error?: string;
  onSelectSong: (songId: string) => void;
  onSelectSourceSong: (songId: string) => void;
  onBaseUrlChange: (baseUrl: string) => void;
  onCheckVoicevox: () => void;
  onStart: () => void;
  onStartDemo: () => void;
  onOpenHowTo: () => void;
  onOpenCredit: () => void;
  onOpenHistory: () => void;
};

export function TitleScreen(props: TitleScreenProps) {
  const { language, setLanguage, t } = useLanguage();
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
              : t('voicevoxNotChecked')}</div>
            <label>
              <span>{t('voicevoxUrl')}</span>
              <input
                value={props.voicevoxBaseUrl}
                onChange={(event) => props.onBaseUrlChange(event.target.value)}
                onBlur={props.onCheckVoicevox}
              />
            </label>
            <button className="small-button" onClick={props.onCheckVoicevox}>
              <RefreshCw size={16} />
              {t('recheck')}
            </button>
          </div>
          <label className="language-panel">
            <span>{t('language')}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'ja')}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
        </div>

        <button className="credit-link" onClick={props.onOpenCredit}>{t('credits')}</button>

        <div className="title-main">
          <img className="title-logo" src={assetUrl('assets/texture/assets/title_logo.png')} alt="シングリンク" />
          <div className="song-picker">
            <div className="song-picker-row">
              <label htmlFor="song-select">{t('quizType')}</label>
              <select
                id="song-select"
                value={props.selectedSongId}
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
            {props.error ? <p className="error-text">{props.error}</p> : null}
          </div>

          <nav className="title-actions" aria-label={t('titleMenu')}>
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/start.png')} label={t('start')} onClick={props.onStart} disabled={props.loading} />
            <button className="demo-button" onClick={props.onStartDemo} disabled={props.loading}>
              <strong>{t('instantDemo')}</strong>
              <span>{t('instantDemoHelp')}</span>
            </button>
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/howtoplay.png')} label={t('howTo')} onClick={props.onOpenHowTo} />
            <button className="history-button" onClick={props.onOpenHistory}>{t('savedSongs')}</button>
          </nav>
        </div>
      </section>
    </ScreenShell>
  );
}
