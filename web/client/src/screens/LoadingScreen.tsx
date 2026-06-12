import { useEffect, useRef, useState } from 'react';
import type { SolvedTask, SongDetail } from '@shared/types';
import { synthesizeSong } from '../lib/api';
import { buildGeneratedFileName } from '../lib/fileName';
import { saveGeneratedTrack } from '../lib/historyDb';
import { ScreenShell } from '../components/ScreenShell';

type LoadingScreenProps = {
  song: SongDetail;
  tasks: SolvedTask[];
  fullLyrics: string;
  inputTexts: string[];
  voicevoxBaseUrl: string;
  onDone: (result: { blob: Blob; blobUrl: string; fileName: string }) => void;
  onBack: () => void;
};

export function LoadingScreen({ song, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, onDone, onBack }: LoadingScreenProps) {
  const [message, setMessage] = useState('ずんだもん が おうた を れんしゅう しているよ');
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return undefined;
    }
    startedRef.current = true;
    let cancelled = false;

    const run = async () => {
      try {
        setMessage('VOICEVOXに歌声をお願いしています...');
        const blob = await synthesizeSong({
          songId: song.id,
          solvedTasks: tasks,
          fullLyrics,
          voicevoxBaseUrl
        });

        if (cancelled) {
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

        if (cancelled) {
          return;
        }
        onDone({
          blob,
          blobUrl: URL.createObjectURL(blob),
          fileName
        });
      } catch (synthesisError) {
        if (!cancelled) {
          setError(synthesisError instanceof Error ? synthesisError.message : String(synthesisError));
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [song, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, onDone]);

  return (
    <ScreenShell background="/assets/texture/assets/loding_background.gif" fit="cover">
      <section className="loading-panel">
        <h1>{message}</h1>
        {!error ? <div className="loading-dots"><span /><span /><span /></div> : null}
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button onClick={onBack}>入力画面へ戻る</button>
          </>
        ) : null}
      </section>
    </ScreenShell>
  );
}
