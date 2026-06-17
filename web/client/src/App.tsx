import { useCallback, useEffect, useState } from 'react';
import type { SolvedTask, SongDetail, SongInfo, VoicevoxVersionResponse } from '@shared/types';
import { fetchSongDetail, fetchSongs, checkVoicevox } from './lib/api';
import { TitleScreen } from './screens/TitleScreen';
import { WriteLyricsScreen } from './screens/WriteLyricsScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultScreen } from './screens/ResultScreen';
import { StaticImageScreen } from './screens/StaticImageScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { assetUrl } from './lib/assets';
import type { GeneratedResult } from './lib/generatedResult';

type Screen = 'title' | 'write' | 'loading' | 'result' | 'story' | 'howto' | 'credit' | 'history';

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [songDetail, setSongDetail] = useState<SongDetail>();
  const [voicevoxBaseUrl, setVoicevoxBaseUrl] = useState('http://localhost:50021');
  const [voicevoxStatus, setVoicevoxStatus] = useState<VoicevoxVersionResponse>();
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [solvedTasks, setSolvedTasks] = useState<SolvedTask[]>([]);
  const [fullLyrics, setFullLyrics] = useState('');
  const [inputTexts, setInputTexts] = useState<string[]>([]);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult>();

  const refreshVoicevox = useCallback(async () => {
    setVoicevoxStatus(await checkVoicevox(voicevoxBaseUrl));
  }, [voicevoxBaseUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        setSongs(await fetchSongs());
      } catch (error) {
        setTitleError(error instanceof Error ? error.message : String(error));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    void refreshVoicevox();
  }, [refreshVoicevox]);

  const startGame = async () => {
    if (!selectedSongId) {
      setTitleError('←きょくをえらんでね！');
      return;
    }

    setLoading(true);
    setTitleError('');
    try {
      const detail = await fetchSongDetail(selectedSongId);
      setSongDetail(detail);
      setSolvedTasks([]);
      setFullLyrics('');
      setInputTexts([]);
      setGeneratedResult(undefined);
      setScreen('write');
    } catch (error) {
      setTitleError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'write' && songDetail) {
    return (
      <WriteLyricsScreen
        song={songDetail}
        onCancel={() => setScreen('title')}
        onComplete={(tasks, lyrics, inputs) => {
          setSolvedTasks(tasks);
          setFullLyrics(lyrics);
          setInputTexts(inputs);
          setScreen('loading');
        }}
      />
    );
  }

  if (screen === 'loading' && songDetail) {
    return (
      <LoadingScreen
        song={songDetail}
        tasks={solvedTasks}
        fullLyrics={fullLyrics}
        inputTexts={inputTexts}
        voicevoxBaseUrl={voicevoxBaseUrl}
        onBack={() => setScreen('write')}
        onDone={(result) => {
          setGeneratedResult(result);
          setScreen('result');
        }}
      />
    );
  }

  if (screen === 'result' && songDetail && generatedResult) {
    return (
      <ResultScreen
        song={songDetail}
        tasks={solvedTasks}
        fullLyrics={fullLyrics}
        result={generatedResult}
        onHistory={() => setScreen('history')}
        onTitle={() => setScreen('title')}
      />
    );
  }

  if (screen === 'story') {
    return <StaticImageScreen title="ストーリー" imageSrc={assetUrl('assets/texture/assets/story.png')} onBack={() => setScreen('title')} />;
  }

  if (screen === 'howto') {
    return <StaticImageScreen title="あそびかた" imageSrc={assetUrl('assets/texture/assets/howtoplay.png')} onBack={() => setScreen('title')} />;
  }

  if (screen === 'credit') {
    return <StaticImageScreen title="クレジット" imageSrc={assetUrl('assets/texture/assets/credit.png')} onBack={() => setScreen('title')} />;
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen('title')} />;
  }

  return (
    <TitleScreen
      songs={songs}
      selectedSongId={selectedSongId}
      voicevoxBaseUrl={voicevoxBaseUrl}
      voicevoxStatus={voicevoxStatus}
      loading={loading}
      error={titleError}
      onSelectSong={setSelectedSongId}
      onBaseUrlChange={setVoicevoxBaseUrl}
      onCheckVoicevox={refreshVoicevox}
      onStart={startGame}
      onOpenStory={() => setScreen('story')}
      onOpenHowTo={() => setScreen('howto')}
      onOpenCredit={() => setScreen('credit')}
      onOpenHistory={() => setScreen('history')}
    />
  );
}
