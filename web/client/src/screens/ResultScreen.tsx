import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';
import type { SolvedTask, SongDetail } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { downloadBlob } from '../lib/fileName';
import { assetUrl } from '../lib/assets';
import type { GeneratedResult } from '../lib/generatedResult';
import { hasGeneratedAudio } from '../lib/generatedResult';

type ResultScreenProps = {
  song: SongDetail;
  tasks: SolvedTask[];
  fullLyrics: string;
  result: GeneratedResult;
  onTitle: () => void;
  onHistory: () => void;
};

export function ResultScreen({ song, tasks, fullLyrics, result, onTitle, onHistory }: ResultScreenProps) {
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const voiceBufferRef = useRef<AudioBuffer | undefined>(undefined);
  const instBufferRef = useRef<AudioBuffer | undefined>(undefined);
  const voiceSourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);
  const instSourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState('');
  const generatedAudio = hasGeneratedAudio(result);

  const userInputs = useMemo(() => tasks.map((task) => task.userInput).filter(Boolean), [tasks]);
  const lines = fullLyrics.replace(/[{}]/g, '').split('\n');

  const stopSources = useCallback(() => {
    try {
      voiceSourceRef.current?.stop();
      instSourceRef.current?.stop();
    } catch {
      // Already-stopped Web Audio sources can throw in some browsers.
    }
    voiceSourceRef.current = undefined;
    instSourceRef.current = undefined;
  }, []);

  const stop = useCallback(() => {
    stopSources();
    setPlaying(false);
  }, [stopSources]);

  const getAudioContext = () => {
    audioContextRef.current ??= new AudioContext();
    return audioContextRef.current;
  };

  const decodeBlob = async (context: AudioContext, blob: Blob) => {
    return context.decodeAudioData(await blob.arrayBuffer());
  };

  const decodeUrl = async (context: AudioContext, url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`伴奏を読み込めませんでした: ${response.statusText}`);
    }
    return context.decodeAudioData(await response.arrayBuffer());
  };

  const ensureBuffers = async (context: AudioContext) => {
    if (!generatedAudio) {
      throw new Error('音声生成をスキップしたため、再生できる音声はありません。');
    }
    voiceBufferRef.current ??= await decodeBlob(context, result.blob);
    if (song.instUrl && !instBufferRef.current) {
      instBufferRef.current = await decodeUrl(context, song.instUrl);
    }
  };

  const startSyncedPlayback = (context: AudioContext) => {
    stopSources();

    const voiceBuffer = voiceBufferRef.current;
    if (!voiceBuffer) {
      throw new Error('歌声データを読み込めませんでした。');
    }

    const startAt = context.currentTime + 0.08;
    const voiceSource = new AudioBufferSourceNode(context, { buffer: voiceBuffer, loop: true });
    voiceSource.connect(context.destination);
    voiceSource.start(startAt);
    voiceSourceRef.current = voiceSource;

    const instBuffer = instBufferRef.current;
    if (instBuffer) {
      const instSource = new AudioBufferSourceNode(context, { buffer: instBuffer, loop: true });
      const instGain = new GainNode(context, { gain: 0.4 });
      instSource.connect(instGain).connect(context.destination);
      instSource.start(startAt);
      instSourceRef.current = instSource;
    }
  };

  const restart = () => {
    if (playing) {
      try {
        startSyncedPlayback(getAudioContext());
      } catch (error) {
        setPlayError(error instanceof Error ? error.message : String(error));
      }
    }
  };

  const play = async () => {
    setPlayError('');
    try {
      const context = getAudioContext();
      if (context.state === 'suspended') {
        await context.resume();
      }
      await ensureBuffers(context);
      startSyncedPlayback(context);
      setPlaying(true);
    } catch (error) {
      setPlaying(false);
      setPlayError(error instanceof Error ? error.message : '音声を再生できませんでした。ブラウザの再生ボタンをもう一度押してください。');
      console.error(error);
    }
  };

  useEffect(() => {
    return () => {
      stop();
      void audioContextRef.current?.close();
    };
  }, [stop]);

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/result_sunny.gif')} fit="cover">
      <section className="result-layout">
        <img className="result-character" src={assetUrl('assets/texture/assets/zunda_singing.gif')} alt="" aria-hidden="true" />
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

          {generatedAudio ? (
          <div className="player-actions">
            <button onClick={playing ? stop : play}>{playing ? <Pause /> : <Play />}{playing ? '停止' : '再生'}</button>
            <button onClick={restart}><RotateCcw />最初から</button>
            <button onClick={() => downloadBlob(result.blob, result.fileName)}><Download />DL</button>
            <button onClick={onHistory}>履歴</button>
          </div>
          ) : (
            <div className="result-notice">
              <strong>音声生成をスキップしました</strong>
              <p>{result.message}</p>
              <p>歌詞と結果はこの画面で確認できます。</p>
            </div>
          )}
          {playError ? <p className="error-text">{playError}</p> : null}
        </div>
        <AssetButton imageSrc={assetUrl('assets/texture/assets/button/title.png')} label="タイトルへ" onClick={onTitle} className="result-title-button" />
      </section>
    </ScreenShell>
  );
}
