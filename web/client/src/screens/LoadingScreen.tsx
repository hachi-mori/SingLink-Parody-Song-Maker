import { useEffect, useRef, useState } from 'react';
import type { SolvedTask, SongDetail } from '@shared/types';
import { synthesizeSong } from '../lib/api';
import { buildGeneratedFileName } from '../lib/fileName';
import { saveGeneratedTrack } from '../lib/historyDb';
import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import type { GeneratedResult } from '../lib/generatedResult';

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
  const [message, setMessage] = useState('ずんだもん が おうた を れんしゅう しているよ');
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
      skipWithMessage('歌声生成に時間がかかっているため、音声なしでリザルトを表示しました。VOICEVOXに接続できない場合でもクイズ結果は確認できます。');
    }, 12_000);

    const run = async () => {
      try {
        if (!voicevoxConnected) {
          skipWithMessage('VOICEVOXに接続されていないため、音声生成をスキップしました。クイズ結果は音声なしで確認できます。');
          return;
        }

        setMessage('VOICEVOXに歌声をお願いしています...');
        const blob = await synthesizeSong({
          songId: song.id,
          solvedTasks: tasks,
          fullLyrics,
          voicevoxBaseUrl
        });

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
          fileName
        });
      } catch (synthesisError) {
        skipWithMessage(synthesisError instanceof Error ? synthesisError.message : String(synthesisError));
      }
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(skipTimer);
    };
  }, [song, tasks, fullLyrics, inputTexts, voicevoxBaseUrl, voicevoxConnected, onDone]);

  const skipVoice = () => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    onDone({
      status: 'skipped',
      message: error || 'VOICEVOXに接続できなかったため、音声生成をスキップしました。'
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
            <button onClick={skipVoice}>音声なしでリザルトを見る</button>
            <button onClick={onBack}>入力画面へ戻る</button>
          </>
        ) : null}
      </section>
    </ScreenShell>
  );
}
