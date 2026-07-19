import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';
import type { KaraokeLineTiming, SolvedTask, SongDetail } from '@shared/types';
import { getKaraokeLineProgress } from '@shared/memorizationScore';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { downloadBlob } from '../lib/fileName';
import { assetUrl } from '../lib/assets';
import type { GeneratedResult } from '../lib/generatedResult';
import { hasGeneratedAudio } from '../lib/generatedResult';
import { useLanguage } from '../lib/i18n';

type ResultScreenProps = {
  song: SongDetail;
  tasks: SolvedTask[];
  fullLyrics: string;
  result: GeneratedResult;
  onTitle: () => void;
  onHistory: () => void;
};

type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended';
type LyricState = 'pending' | 'active' | 'completed';

function getLyricState(playbackState: PlaybackState, playbackTime: number, timing?: KaraokeLineTiming): LyricState {
  if (!timing || playbackState === 'idle') return 'pending';
  if (playbackState === 'ended' || playbackTime >= timing.endSeconds) return 'completed';
  if (playbackTime >= timing.startSeconds) return 'active';
  return 'pending';
}

function getLineProgress(state: LyricState, playbackTime: number, timing?: KaraokeLineTiming): number {
  if (state === 'completed') return 1;
  if (state !== 'active' || !timing || timing.endSeconds <= timing.startSeconds) return 0;
  return getKaraokeLineProgress(timing, playbackTime);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function ResultScreen({ song, tasks, fullLyrics, result, onTitle, onHistory }: ResultScreenProps) {
  const { t } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const voiceBufferRef = useRef<AudioBuffer | undefined>(undefined);
  const instBufferRef = useRef<AudioBuffer | undefined>(undefined);
  const voiceSourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);
  const instSourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);
  const lyricLineRefs = useRef<Array<HTMLElement | null>>([]);
  const playbackGenerationRef = useRef(0);
  const playbackOffsetRef = useRef(0);
  const scheduledStartRef = useRef(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playError, setPlayError] = useState('');
  const generatedAudio = hasGeneratedAudio(result);

  const lines = useMemo(() => fullLyrics.replace(/[{}]/g, '').split('\n').filter(Boolean), [fullLyrics]);
  const singingTasks = useMemo(
    () => tasks.filter((task) => typeof task.singingReading === 'string' && task.singingReading.length > 0),
    [tasks]
  );
  const timings = generatedAudio ? result.karaokeTimings : [];
  const activeLineIndex = timings.findIndex(
    (timing) => getLyricState(playbackState, playbackTime, timing) === 'active'
  );

  const stopSources = useCallback(() => {
    playbackGenerationRef.current += 1;
    for (const source of [voiceSourceRef.current, instSourceRef.current]) {
      try { source?.stop(); } catch { /* An AudioBufferSourceNode can only stop once. */ }
    }
    voiceSourceRef.current = undefined;
    instSourceRef.current = undefined;
  }, []);

  const getAudioContext = () => {
    audioContextRef.current ??= new AudioContext();
    return audioContextRef.current;
  };

  const decodeBlob = async (context: AudioContext, blob: Blob) => context.decodeAudioData(await blob.arrayBuffer());
  const decodeUrl = async (context: AudioContext, url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(t('accompanimentError', { detail: response.statusText }));
    return context.decodeAudioData(await response.arrayBuffer());
  };

  const ensureBuffers = async (context: AudioContext) => {
    if (!generatedAudio) throw new Error(t('skippedAudioError'));
    voiceBufferRef.current ??= await decodeBlob(context, result.blob);
    if (song.instUrl && !instBufferRef.current) instBufferRef.current = await decodeUrl(context, song.instUrl);
  };

  const playbackDuration = () => Math.max(voiceBufferRef.current?.duration ?? 0, instBufferRef.current?.duration ?? 0);

  const readPlaybackOffset = (context: AudioContext) => {
    const elapsed = Math.max(0, context.currentTime - scheduledStartRef.current);
    return Math.min(playbackDuration(), playbackOffsetRef.current + elapsed);
  };

  const startSource = (
    context: AudioContext,
    buffer: AudioBuffer | undefined,
    startAt: number,
    offset: number,
    connect: (source: AudioBufferSourceNode) => void
  ) => {
    if (!buffer || offset >= buffer.duration) return undefined;
    const source = new AudioBufferSourceNode(context, { buffer });
    connect(source);
    source.start(startAt, offset);
    return source;
  };

  const startSyncedPlayback = (context: AudioContext, requestedOffset: number) => {
    stopSources();
    const duration = playbackDuration();
    const offset = Math.min(Math.max(0, requestedOffset), duration);
    if (duration <= 0 || offset >= duration) {
      playbackOffsetRef.current = duration;
      setPlaybackTime(duration);
      setPlaybackState('ended');
      return;
    }

    const startAt = context.currentTime + 0.08;
    scheduledStartRef.current = startAt;
    playbackOffsetRef.current = offset;
    const generation = playbackGenerationRef.current;
    const voiceSource = startSource(context, voiceBufferRef.current, startAt, offset, (source) => source.connect(context.destination));
    voiceSourceRef.current = voiceSource;
    const instSource = startSource(context, instBufferRef.current, startAt, offset, (source) => {
      const gain = new GainNode(context, { gain: 0.4 });
      source.connect(gain).connect(context.destination);
    });
    instSourceRef.current = instSource;

    const candidates = [
      voiceSource && voiceBufferRef.current ? { source: voiceSource, remaining: voiceBufferRef.current.duration - offset } : undefined,
      instSource && instBufferRef.current ? { source: instSource, remaining: instBufferRef.current.duration - offset } : undefined
    ].filter((item): item is { source: AudioBufferSourceNode; remaining: number } => Boolean(item));
    const completion = candidates.sort((a, b) => b.remaining - a.remaining)[0];
    if (!completion) {
      setPlaybackState('ended');
      return;
    }
    completion.source.onended = () => {
      if (playbackGenerationRef.current !== generation) return;
      playbackOffsetRef.current = duration;
      setPlaybackTime(Math.max(duration, timings.at(-1)?.endSeconds ?? 0));
      voiceSourceRef.current = undefined;
      instSourceRef.current = undefined;
      setPlaybackState('ended');
    };
    setPlaybackTime(offset);
    setPlaybackState('playing');
  };

  const play = async () => {
    setPlayError('');
    try {
      const context = getAudioContext();
      if (context.state === 'suspended') await context.resume();
      await ensureBuffers(context);
      const offset = playbackState === 'ended' ? 0 : playbackOffsetRef.current;
      startSyncedPlayback(context, offset);
    } catch (error) {
      setPlaybackState('idle');
      setPlayError(error instanceof Error ? error.message : t('playbackError'));
      console.error(error);
    }
  };

  const pause = () => {
    const context = audioContextRef.current;
    if (!context || playbackState !== 'playing') return;
    const offset = readPlaybackOffset(context);
    playbackOffsetRef.current = offset;
    setPlaybackTime(offset);
    stopSources();
    setPlaybackState('paused');
  };

  const restart = async () => {
    setPlayError('');
    playbackOffsetRef.current = 0;
    setPlaybackTime(0);
    try {
      const context = getAudioContext();
      if (context.state === 'suspended') await context.resume();
      await ensureBuffers(context);
      startSyncedPlayback(context, 0);
    } catch (error) {
      setPlaybackState('idle');
      setPlayError(error instanceof Error ? error.message : t('playbackError'));
    }
  };

  useEffect(() => {
    if (playbackState !== 'playing') return undefined;
    let frame = 0;
    const update = () => {
      const context = audioContextRef.current;
      if (context) setPlaybackTime(readPlaybackOffset(context));
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [playbackState]);

  useEffect(() => {
    if (activeLineIndex < 0) return;
    lyricLineRefs.current[activeLineIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }, [activeLineIndex, prefersReducedMotion]);

  useEffect(() => () => {
    stopSources();
    const context = audioContextRef.current;
    audioContextRef.current = undefined;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }, [stopSources]);

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/result_sunny.gif')} fit="cover">
      <section className="result-layout">
        <img className="result-character" src={assetUrl('assets/texture/assets/zunda_singing.gif')} alt="" aria-hidden="true" />
        <div className="result-card">
          <p className="result-song-source">{t('songSourceEyebrow')}</p>
          <h1>{t('songMadeWith', { song: song.sourceSong?.title ?? song.trackName ?? song.title })}</h1>
          <div className="karaoke-legend" aria-label="Karaoke lyric states">
            <span data-state="pending">○ {t('pendingLyric')}</span>
            <span data-state="active">▶ {t('currentLyric')}</span>
            <span data-state="completed">✓ {t('completedLyric')}</span>
          </div>
          <div className="lyrics-box karaoke-lyrics" aria-live="polite">
            {lines.map((line, lineIndex) => {
              const timing = timings[lineIndex];
              const task = singingTasks[lineIndex];
              const state = getLyricState(playbackState, playbackTime, timing);
              const progress = getLineProgress(state, playbackTime, timing);
              const characters = Array.from(line);
              return (
                <article
                  className={`karaoke-line karaoke-line--${state}${task?.isCorrect === false ? ' karaoke-line--incorrect' : ''}`}
                  key={`${line}-${lineIndex}`}
                  ref={(element) => { lyricLineRefs.current[lineIndex] = element; }}
                >
                  <span className="karaoke-state-label">{state === 'active' ? `▶ ${t('currentLyric')}` : state === 'completed' ? `✓ ${t('completedLyric')}` : `○ ${t('pendingLyric')}`}</span>
                  <p className="karaoke-japanese" lang="ja">
                    <span className="sr-only">{line}</span>
                    <span className="karaoke-japanese-characters" aria-hidden="true">
                      {characters.map((character, characterIndex) => {
                        const characterStart = characterIndex / characters.length;
                        const characterEnd = (characterIndex + 1) / characters.length;
                        const characterProgress = Math.min(1, Math.max(
                          0,
                          (progress - characterStart) / (characterEnd - characterStart)
                        ));
                        const visibleCharacterProgress = prefersReducedMotion
                          ? Number(characterProgress > 0)
                          : characterProgress;
                        return (
                          <span className="karaoke-character" key={`${character}-${characterIndex}`}>
                            <span className="karaoke-japanese-base">{character}</span>
                            <span
                              className="karaoke-japanese-progress"
                              style={{ clipPath: `inset(0 ${100 - visibleCharacterProgress * 100}% 0 0)` }}
                            >{character}</span>
                          </span>
                        );
                      })}
                    </span>
                  </p>
                  <p className="karaoke-english" lang="en">{task?.englishExample ?? t('translationUnavailable')}</p>
                  <p className="karaoke-meaning" lang="en">{task?.englishMeaning ?? t('translationUnavailable')}</p>
                </article>
              );
            })}
          </div>

          {generatedAudio ? (
            <div className="player-actions">
              <button onClick={playbackState === 'playing' ? pause : play}>
                {playbackState === 'playing' ? <Pause /> : <Play />}{playbackState === 'playing' ? t('pause') : t('play')}
              </button>
              <button onClick={() => void restart()}><RotateCcw />{t('restart')}</button>
              <button onClick={() => downloadBlob(result.blob, result.fileName)}><Download />{t('download')}</button>
              <button onClick={onHistory}>{t('history')}</button>
            </div>
          ) : (
            <div className="result-notice">
              <strong>{t('audioSkipped')}</strong>
              <p>{result.message}</p>
              <p>{t('lyricsStillAvailable')}</p>
            </div>
          )}
          {playError ? <p className="error-text">{playError}</p> : null}
        </div>
        <AssetButton imageSrc={assetUrl('assets/texture/assets/button/title.png')} label={t('backToTitle')} onClick={onTitle} className="result-title-button" />
      </section>
    </ScreenShell>
  );
}
