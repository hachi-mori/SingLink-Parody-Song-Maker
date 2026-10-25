import { useEffect, useRef, useState } from 'react';
import type { DatasetId, SolvedTask, SongDetail } from '@shared/types';
import { synthesizeSong } from '../lib/api';
import { buildGeneratedFileName } from '../lib/fileName';
import { saveGeneratedTrack } from '../lib/historyDb';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import type { GeneratedResult } from '../lib/generatedResult';
import { buildSongKaraokeTimings } from '../lib/karaoke';
import { useLanguage } from '../lib/i18n';
import { savesHistoryForDataset } from '../lib/quizDatasets';

type LoadingScreenProps = {
  song: SongDetail;
  datasetId: DatasetId;
  tasks: SolvedTask[];
  fullLyrics: string;
  inputTexts: string[];
  voicevoxBaseUrl: string;
  voicevoxConnected: boolean;
  onDone: (result: GeneratedResult) => void;
  onBack: () => void;
};

type PreparedAudio = Omit<Extract<GeneratedResult, { status: 'generated' }>, 'blobUrl' | 'historyWarning'>;

export function LoadingScreen({ song, datasetId, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, voicevoxConnected, onDone }: LoadingScreenProps) {
  const { language, t } = useLanguage();
  const [requesting, setRequesting] = useState(false);
  // Callback and language changes must not cancel an in-flight generation.
  const currentUi = useRef({ onDone, language, t });
  currentUi.current = { onDone, language, t };

  useEffect(() => {
    let cancelled = false;
    let completed = false;
    let preparedAudio: PreparedAudio | undefined;
    const historyWarning = () => currentUi.current.language === 'en'
      ? 'History save could not be confirmed. You can still play and download this song.'
      : '履歴への保存を確認できませんでした。再生・ダウンロードはできます。';
    const finish = (result: GeneratedResult) => {
      if (cancelled || completed) return;
      completed = true;
      window.clearTimeout(timeout);
      currentUi.current.onDone(result);
    };
    const finishAudio = (warning?: string) => {
      if (cancelled || completed || !preparedAudio) return;
      finish({
        ...preparedAudio,
        blobUrl: URL.createObjectURL(preparedAudio.blob),
        ...(warning ? { historyWarning: warning } : {})
      });
    };
    const timeout = window.setTimeout(() => {
      if (preparedAudio) finishAudio(historyWarning());
      else finish({ status: 'skipped', message: currentUi.current.t('generationTimeout') });
    }, 180_000);
    setRequesting(false);

    const run = async () => {
      // StrictMode cleans up its first effect before this microtask runs.
      if (cancelled || completed) return;
      try {
        if (datasetId === 'browserImport' && tasks.filter((task) => task.singingReading).length !== 4) {
          finish({ status: 'skipped', message: '歌うための読みがないので、歌声はありません。' });
          return;
        }
        if (!voicevoxConnected) {
          finish({ status: 'skipped', message: currentUi.current.t('generationOffline') });
          return;
        }

        setRequesting(true);
        const [blob, karaokeTimings] = await Promise.all([synthesizeSong({
          datasetId,
          songId: song.id,
          sourceSongId: song.sourceSong?.id,
          solvedTasks: tasks,
          fullLyrics,
          voicevoxBaseUrl
        }, song, datasetId), buildSongKaraokeTimings(song, tasks, fullLyrics, datasetId)]);
        if (cancelled || completed) return;

        const fileName = buildGeneratedFileName(song.title);
        preparedAudio = { status: 'generated', source: 'live', blob, fileName, karaokeTimings };
        let warning: string | undefined;
        if (savesHistoryForDataset(datasetId)) {
          try {
            await saveGeneratedTrack({
              datasetId,
              id: crypto.randomUUID(),
              songTitle: song.title,
              fileName,
              createdAt: new Date().toISOString(),
              lyrics: fullLyrics,
              userInputs: inputTexts,
              voicevoxBaseUrl,
              wavBlob: blob
            }, datasetId);
          } catch {
            // Storage is optional: a successful synthesis remains playable.
            warning = historyWarning();
          }
        }
        finishAudio(warning);
      } catch (synthesisError) {
        finish({
          status: 'skipped',
          message: currentUi.current.language === 'en'
            ? currentUi.current.t('generationSkippedFallback')
            : synthesisError instanceof Error ? synthesisError.message : String(synthesisError)
        });
      }
    };

    void Promise.resolve().then(run);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [song, datasetId, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, voicevoxConnected]);

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/loding_background.gif')} fit="cover">
      <section className="loading-panel">
        <h1>{requesting ? t('requestingVoice') : t('preparingVoice')}</h1>
        <div className="loading-dots"><span /><span /><span /></div>
      </section>
    </ScreenShell>
  );
}
