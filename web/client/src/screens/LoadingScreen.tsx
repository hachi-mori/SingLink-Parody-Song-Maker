import { useEffect, useRef, useState } from 'react';
import type { SolvedTask, SongDetail } from '@shared/types';
import { synthesizeSong } from '../lib/api';
import { buildGeneratedFileName } from '../lib/fileName';
import { saveGeneratedTrack } from '../lib/historyDb';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import type { GeneratedResult } from '../lib/generatedResult';
import { buildSongKaraokeTimings } from '../lib/karaoke';
import { useLanguage } from '../lib/i18n';

type LoadingScreenProps = {
  song: SongDetail;
  tasks: SolvedTask[];
  fullLyrics: string;
  inputTexts: string[];
  voicevoxBaseUrl: string;
  voicevoxConnected: boolean;
  onDone: (result: GeneratedResult) => void;
  onBack: () => void;
};

export function LoadingScreen({ song, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, voicevoxConnected, onDone, onBack }: LoadingScreenProps) {
  const { language, t } = useLanguage();
  const [message, setMessage] = useState(() => t('preparingVoice'));
  const [error, setError] = useState('');
  const startedRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return undefined;
    }
    startedRef.current = true;
    let cancelled = false;
    const skipWithMessage = (reason: string) => {
      if (cancelled || doneRef.current) {
        return;
      }
      doneRef.current = true;
      onDone({
        status: 'skipped',
        message: reason
      });
    };
    const skipTimer = window.setTimeout(() => {
      skipWithMessage(t('generationTimeout'));
    }, 180_000);

    const run = async () => {
      try {
        if (!voicevoxConnected) {
          skipWithMessage(t('generationOffline'));
          return;
        }

        setMessage(t('requestingVoice'));
        const [blob, karaokeTimings] = await Promise.all([synthesizeSong({
          songId: song.id,
          sourceSongId: song.sourceSong?.id,
          solvedTasks: tasks,
          fullLyrics,
          voicevoxBaseUrl
        }, song), buildSongKaraokeTimings(song, tasks)]);

        if (cancelled || doneRef.current) {
          return;
        }

        const fileName = buildGeneratedFileName(song.title);
        const id = crypto.randomUUID();
        await saveGeneratedTrack({
          id,
          songTitle: song.title,
          fileName,
          createdAt: new Date().toISOString(),
          lyrics: fullLyrics,
          userInputs: inputTexts,
          voicevoxBaseUrl,
          wavBlob: blob
        });

        if (cancelled || doneRef.current) {
          return;
        }
        doneRef.current = true;
        onDone({
          status: 'generated',
          blob,
          blobUrl: URL.createObjectURL(blob),
          fileName,
          karaokeTimings
        });
      } catch (synthesisError) {
        skipWithMessage(language === 'en'
          ? t('generationSkippedFallback')
          : synthesisError instanceof Error ? synthesisError.message : String(synthesisError));
      }
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(skipTimer);
    };
  }, [song, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, voicevoxConnected, onDone, language, t]);

  const skipVoice = () => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    onDone({
      status: 'skipped',
      message: error || t('generationSkippedFallback')
    });
  };

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/loding_background.gif')} fit="cover">
      <section className="loading-panel">
        <h1>{message}</h1>
        {!error ? <div className="loading-dots"><span /><span /><span /></div> : null}
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button onClick={skipVoice}>{t('skipVoice')}</button>
            <button onClick={onBack}>{t('backToQuiz')}</button>
          </>
        ) : null}
      </section>
    </ScreenShell>
  );
}
