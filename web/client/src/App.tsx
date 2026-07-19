import { useCallback, useEffect, useState } from 'react';
import { defaultMemorizationSourceSongId } from '@shared/memorizationSongs';
import type { SolvedTask, SongDetail, SongInfo, SourceSongInfo, VoicevoxVersionResponse } from '@shared/types';
import { fetchSongDetail, fetchSongs, checkVoicevox } from './lib/api';
import { getStaticMemorizationSourceSongs } from './lib/staticSongs';
import { TitleScreen } from './screens/TitleScreen';
import { WriteLyricsScreen } from './screens/WriteLyricsScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultScreen } from './screens/ResultScreen';
import { StaticImageScreen } from './screens/StaticImageScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { assetUrl } from './lib/assets';
import type { GeneratedResult } from './lib/generatedResult';
import { useLanguage } from './lib/i18n';

type Screen = 'title' | 'write' | 'loading' | 'result' | 'howto' | 'credit' | 'history';

export function App() {
  const { language, t } = useLanguage();
  const sourceSongs = getStaticMemorizationSourceSongs();
  const [screen, setScreen] = useState<Screen>('title');
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [selectedSourceSongId, setSelectedSourceSongId] = useState(defaultMemorizationSourceSongId);
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
        setTitleError(language === 'en' ? t('genericLoadError') : error instanceof Error ? error.message : String(error));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    void refreshVoicevox();
  }, [refreshVoicevox]);

  const startGame = async () => {
    if (!selectedSongId) {
      setTitleError(t('selectSongError'));
      return;
    }

    setLoading(true);
    setTitleError('');
    try {
      const detail = await fetchSongDetail(selectedSongId);
      let selectedDetail: SongDetail = detail;
      if (detail.mode === 'onomatopoeiaQuiz') {
        const sourceSong = sourceSongs.find((song) => song.id === selectedSourceSongId);
        if (!sourceSong) {
          throw new Error(t('sourceSongMissing'));
        }
        selectedDetail = {
          ...detail,
          sourceSong,
          instFileName: sourceSong.instFileName,
          instUrl: sourceSong.instUrl,
          baseScoreFileName: sourceSong.scoreFileName,
          baseScoreUrl: sourceSong.scoreUrl,
          trackName: sourceSong.title
        };
      }
      setSongDetail(selectedDetail);
      setSolvedTasks([]);
      setFullLyrics('');
      setInputTexts([]);
      setGeneratedResult(undefined);
      setScreen('write');
    } catch (error) {
      setTitleError(language === 'en' ? t('genericLoadError') : error instanceof Error ? error.message : String(error));
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
        voicevoxConnected={voicevoxStatus?.ok !== false}
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

  if (screen === 'howto') {
    return <StaticImageScreen title={t('howToTitle')} description={t('howToBody')} imageSrc={language === 'ja' ? assetUrl('assets/texture/assets/howtoplay.png') : undefined} onBack={() => setScreen('title')} />;
  }

  if (screen === 'credit') {
    return <StaticImageScreen title={t('creditsTitle')} description={t('creditsBody')} imageSrc={assetUrl('assets/texture/assets/credit.png')} onBack={() => setScreen('title')} />;
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen('title')} />;
  }

  return (
    <TitleScreen
      songs={songs}
      selectedSongId={selectedSongId}
      sourceSongs={sourceSongs}
      selectedSourceSongId={selectedSourceSongId}
      sourceSelectionEnabled={songs.find((song) => song.id === selectedSongId)?.mode === 'onomatopoeiaQuiz'}
      voicevoxBaseUrl={voicevoxBaseUrl}
      voicevoxStatus={voicevoxStatus}
      loading={loading}
      error={titleError}
      onSelectSong={setSelectedSongId}
      onSelectSourceSong={setSelectedSourceSongId}
      onBaseUrlChange={setVoicevoxBaseUrl}
      onCheckVoicevox={refreshVoicevox}
      onStart={startGame}
      onOpenHowTo={() => setScreen('howto')}
      onOpenCredit={() => setScreen('credit')}
      onOpenHistory={() => setScreen('history')}
    />
  );
}
