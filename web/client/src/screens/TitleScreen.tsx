import { RefreshCw } from 'lucide-react';
import type { SongInfo, VoicevoxVersionResponse } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';

type TitleScreenProps = {
  songs: SongInfo[];
  selectedSongId: string;
  voicevoxBaseUrl: string;
  voicevoxStatus?: VoicevoxVersionResponse;
  loading: boolean;
  error?: string;
  onSelectSong: (songId: string) => void;
  onBaseUrlChange: (baseUrl: string) => void;
  onCheckVoicevox: () => void;
  onStart: () => void;
  onOpenStory: () => void;
  onOpenHowTo: () => void;
  onOpenCredit: () => void;
  onOpenHistory: () => void;
};

export function TitleScreen(props: TitleScreenProps) {
  const statusClass = props.voicevoxStatus?.ok ? 'status-ok' : 'status-warn';

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/title_background.png')} fit="cover">
      <section className="title-layout">
        <div className="voicevox-panel">
          <div className={statusClass}>{props.voicevoxStatus?.message ?? 'VOICEVOX確認中...'}</div>
          <label>
            <span>VOICEVOX URL</span>
            <input
              value={props.voicevoxBaseUrl}
              onChange={(event) => props.onBaseUrlChange(event.target.value)}
              onBlur={props.onCheckVoicevox}
            />
          </label>
          <button className="small-button" onClick={props.onCheckVoicevox}>
            <RefreshCw size={16} />
            再確認
          </button>
        </div>

        <button className="credit-link" onClick={props.onOpenCredit}>クレジット</button>

        <div className="title-main">
          <img className="title-logo" src={assetUrl('assets/texture/assets/title_logo.png')} alt="シングリンク" />
          <div className="song-picker">
            <div className="song-picker-row">
              <label htmlFor="song-select">あそぶ問題</label>
              <select
                id="song-select"
                value={props.selectedSongId}
                onChange={(event) => props.onSelectSong(event.target.value)}
              >
                <option value="">問題をえらんでね</option>
                {props.songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="song-picker-row song-picker-row--coming-soon">
              <label htmlFor="source-song-select">もとの曲</label>
              <select id="source-song-select" value={props.selectedSongId} disabled>
                <option value="">問題と同じ曲</option>
                {props.songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
              </select>
              <small>今は問題と同じ曲で作ります</small>
            </div>
            {props.error ? <p className="error-text">{props.error}</p> : null}
          </div>

          <nav className="title-actions" aria-label="タイトルメニュー">
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/story.png')} label="ストーリー" onClick={props.onOpenStory} />
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/start.png')} label="スタート" onClick={props.onStart} disabled={props.loading} />
            <AssetButton imageSrc={assetUrl('assets/texture/assets/button/howtoplay.png')} label="あそびかた" onClick={props.onOpenHowTo} />
            <button className="history-button" onClick={props.onOpenHistory}>保存した曲</button>
          </nav>
        </div>
      </section>
    </ScreenShell>
  );
}
