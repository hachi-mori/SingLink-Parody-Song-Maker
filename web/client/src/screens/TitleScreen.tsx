import { RefreshCw } from 'lucide-react';
import type { SongInfo, VoicevoxVersionResponse } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';

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
    <ScreenShell background="/assets/texture/assets/title_background.png" fit="cover">
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

        <img className="title-logo" src="/assets/texture/assets/title_logo.png" alt="シングリンク" />
        <div className="title-frame">
          <img src="/assets/texture/assets/title_frame_w_trans.png" alt="" aria-hidden="true" />
          <div className="song-picker">
            <label htmlFor="song-select">あそぶ曲</label>
            <select
              id="song-select"
              value={props.selectedSongId}
              onChange={(event) => props.onSelectSong(event.target.value)}
            >
              <option value="">きょくをえらんでね</option>
              {props.songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            {props.error ? <p className="error-text">{props.error}</p> : null}
          </div>
        </div>

        <nav className="title-actions" aria-label="タイトルメニュー">
          <AssetButton imageSrc="/assets/texture/assets/button/story.png" label="ストーリー" onClick={props.onOpenStory} />
          <AssetButton imageSrc="/assets/texture/assets/button/start.png" label="スタート" onClick={props.onStart} disabled={props.loading} />
          <AssetButton imageSrc="/assets/texture/assets/button/howtoplay.png" label="あそびかた" onClick={props.onOpenHowTo} />
          <button className="history-button" onClick={props.onOpenHistory}>保存した曲</button>
        </nav>
      </section>
    </ScreenShell>
  );
}
