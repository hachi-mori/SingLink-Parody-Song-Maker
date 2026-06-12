import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';
import type { SolvedTask, SongDetail } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { downloadBlob } from '../lib/fileName';

type ResultScreenProps = {
  song: SongDetail;
  tasks: SolvedTask[];
  fullLyrics: string;
  result: {
    blob: Blob;
    blobUrl: string;
    fileName: string;
  };
  onTitle: () => void;
  onHistory: () => void;
};

export function ResultScreen({ song, tasks, fullLyrics, result, onTitle, onHistory }: ResultScreenProps) {
  const voiceRef = useRef<HTMLAudioElement>(null);
  const instRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState('');

  const userInputs = useMemo(() => tasks.map((task) => task.userInput).filter(Boolean), [tasks]);
  const lines = fullLyrics.replace(/[{}]/g, '').split('\n');

  const stop = () => {
    voiceRef.current?.pause();
    instRef.current?.pause();
    setPlaying(false);
  };

  const restart = () => {
    if (voiceRef.current) {
      voiceRef.current.currentTime = 0;
    }
    if (instRef.current) {
      instRef.current.currentTime = 0;
    }
  };

  const play = async () => {
    setPlayError('');
    try {
      restart();
      if (instRef.current) {
        instRef.current.volume = 0.4;
        await instRef.current.play();
      }
      await voiceRef.current?.play();
      setPlaying(true);
    } catch (error) {
      setPlaying(false);
      setPlayError('音声を再生できませんでした。ブラウザの再生ボタンをもう一度押してください。');
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <ScreenShell background="/assets/texture/assets/result_sunny.gif" fit="cover">
      <section className="result-layout">
        <img className="result-character" src="/assets/texture/assets/zunda_singing.gif" alt="" aria-hidden="true" />
        <div className="result-card">
          <p>{song.title}の曲で作った</p>
          <h1>{song.trackName || song.title}</h1>
          <div className="lyrics-box">
            {lines.map((line, lineIndex) => (
              <p key={`${line}-${lineIndex}`}>
                {[...line].map((char, charIndex) => {
                  const colored = userInputs.some((input) => input && line.includes(input) && charIndex >= line.indexOf(input) && charIndex < line.indexOf(input) + input.length);
                  return <span className={colored ? 'user-lyric' : undefined} key={`${char}-${charIndex}`}>{char}</span>;
                })}
              </p>
            ))}
          </div>

          <div className="player-actions">
            <button onClick={playing ? stop : play}>{playing ? <Pause /> : <Play />}{playing ? '停止' : '再生'}</button>
            <button onClick={restart}><RotateCcw />最初から</button>
            <button onClick={() => downloadBlob(result.blob, result.fileName)}><Download />DL</button>
            <button onClick={onHistory}>履歴</button>
          </div>
          {playError ? <p className="error-text">{playError}</p> : null}
        </div>
        <AssetButton imageSrc="/assets/texture/assets/button/title.png" label="タイトルへ" onClick={onTitle} className="result-title-button" />
      </section>
      <audio ref={voiceRef} src={result.blobUrl} loop />
      {song.instUrl ? <audio ref={instRef} src={song.instUrl} loop /> : null}
    </ScreenShell>
  );
}
