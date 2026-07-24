import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultMemorizationSourceSongId } from '@shared/memorizationSongs';
import type { DatasetId, QuizDataset, SolvedTask, SongDetail, SongInfo, SourceSongInfo, VoicevoxVersionResponse } from '@shared/types';
import { fetchLocalBookQuizRound, fetchQuizDatasets, fetchSongDetail, fetchSongs, checkVoicevox } from './lib/api';
import { getStaticMemorizationSourceSongs } from './lib/staticSongs';
import { TitleScreen } from './screens/TitleScreen';
import { WriteLyricsScreen } from './screens/WriteLyricsScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultScreen } from './screens/ResultScreen';
import { StaticImageScreen } from './screens/StaticImageScreen';
import { HowToScreen } from './screens/HowToScreen';
import { CreditsScreen } from './screens/CreditsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { assetUrl } from './lib/assets';
import type { GeneratedResult } from './lib/generatedResult';
import { useLanguage } from './lib/i18n';
import { loadDemoBundle, type DemoBundle } from './lib/demo';
import { completeFixedDemo, getFixedDemoQuestions, shouldCheckVoicevoxOnInitialLoad } from './lib/demoFlow';
import { original335Dataset, supportsEnglishForDataset } from './lib/quizDatasets';

type Screen = 'title' | 'write' | 'loading' | 'result' | 'howto' | 'credit' | 'history';

export function App() {
  const { language, setLanguage, t } = useLanguage();
  const sourceSongs = getStaticMemorizationSourceSongs();
  const demoRequested = new URLSearchParams(window.location.search).get('demo') === '1';
  const [screen, setScreen] = useState<Screen>('title');
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [datasets, setDatasets] = useState<QuizDataset[]>([original335Dataset]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<DatasetId>('original335');
  const [activeDatasetId, setActiveDatasetId] = useState<DatasetId>('original335');
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
  const [demoInfo, setDemoInfo] = useState<Pick<DemoBundle, 'disclosure' | 'credits'>>();
  const [demoBundle, setDemoBundle] = useState<DemoBundle>();
  const demoRequestedRef = useRef(false);

  const refreshVoicevox = useCallback(async () => {
    setVoicevoxStatus(await checkVoicevox(voicevoxBaseUrl));
  }, [voicevoxBaseUrl]);

  const startDemo = useCallback(async () => {
    setLoading(true);
    setTitleError('');
    try {
      const demo = await loadDemoBundle();
      setSongDetail(demo.song);
      setActiveDatasetId('original335');
      setSolvedTasks([]);
      setFullLyrics('');
      setInputTexts([]);
      setGeneratedResult(undefined);
      setDemoInfo({ disclosure: demo.disclosure, credits: demo.credits });
      setDemoBundle(demo);
      setScreen('write');
    } catch (error) {
      setTitleError(language === 'en'
        ? t('demoLoadError')
        : error instanceof Error ? error.message : String(error));
      setScreen('title');
    } finally {
      setLoading(false);
    }
  }, [language, t]);

  useEffect(() => {
    if (demoRequested) return;
    const load = async () => {
      try {
        const [nextSongs, nextDatasets] = await Promise.all([fetchSongs(), fetchQuizDatasets()]);
        setSongs(nextSongs);
        setDatasets(nextDatasets);
      } catch (error) {
        setTitleError(language === 'en' ? t('genericLoadError') : error instanceof Error ? error.message : String(error));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (selectedDatasetId === 'localBook100' && language !== 'ja') {
      setLanguage('ja');
    }
  }, [selectedDatasetId, language, setLanguage]);

  useEffect(() => {
    if (!shouldCheckVoicevoxOnInitialLoad(window.location.search)) return;
    void refreshVoicevox();
  }, [refreshVoicevox]);

  useEffect(() => {
    if (demoRequestedRef.current || !demoRequested) return;
    demoRequestedRef.current = true;
    void startDemo();
  }, [startDemo]);

  const startGame = async () => {
    if (!selectedSongId) {
      setTitleError(t('selectSongError'));
      return;
    }

    setLoading(true);
    setTitleError('');
    try {
      const detail = await fetchSongDetail(selectedSongId);
      if (selectedDatasetId === 'localBook100' && detail.mode !== 'onomatopoeiaQuiz') {
        throw new Error(language === 'en'
          ? 'The local book dataset is available only for the onomatopoeia quiz.'
          : 'ローカルの書籍教材はオノマトペクイズでのみ利用できます。');
      }
      const localBookRound = selectedDatasetId === 'localBook100'
        ? await fetchLocalBookQuizRound()
        : undefined;
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
      if (localBookRound) {
        selectedDetail = {
          ...selectedDetail,
          onomatopoeiaEntries: localBookRound.entries
        };
      }
      setSongDetail(selectedDetail);
      setActiveDatasetId(selectedDatasetId);
      setSolvedTasks([]);
      setFullLyrics('');
      setInputTexts([]);
      setGeneratedResult(undefined);
      setDemoInfo(undefined);
      setDemoBundle(undefined);
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
        datasetId={activeDatasetId}
        fixedOnomatopoeiaEntries={demoBundle ? getFixedDemoQuestions(demoBundle) : undefined}
        onCancel={() => setScreen('title')}
        onComplete={(tasks, lyrics, inputs) => {
          if (demoBundle) {
            const completion = completeFixedDemo(demoBundle, inputs);
            setSolvedTasks(completion.tasks);
            setFullLyrics(completion.fullLyrics);
            setInputTexts(completion.inputTexts);
            setGeneratedResult(completion.result);
            setScreen(completion.nextScreen);
            return;
          }
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
        datasetId={activeDatasetId}
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
        datasetId={activeDatasetId}
        tasks={solvedTasks}
        fullLyrics={fullLyrics}
        result={generatedResult}
        demoDisclosure={demoInfo?.disclosure[language]}
        demoCredits={demoInfo?.credits}
        onHistory={() => setScreen('history')}
        onTitle={() => setScreen('title')}
      />
    );
  }

  if (screen === 'howto') {
    if (language === 'en') {
      return <HowToScreen onBack={() => setScreen('title')} />;
    }
    return <StaticImageScreen title={t('howToTitle')} description={t('howToBody')} imageSrc={language === 'ja' ? assetUrl('assets/texture/assets/howtoplay.png') : undefined} onBack={() => setScreen('title')} />;
  }

  if (screen === 'credit') {
    if (language === 'en') {
      return <CreditsScreen onBack={() => setScreen('title')} />;
    }
    return <StaticImageScreen title={t('creditsTitle')} description={t('creditsBody')} imageSrc={assetUrl('assets/texture/assets/credit.png')} onBack={() => setScreen('title')} />;
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen('title')} />;
  }

  return (
    <TitleScreen
      songs={songs}
      datasets={datasets}
      selectedDatasetId={selectedDatasetId}
      selectedSongId={selectedSongId}
      sourceSongs={sourceSongs}
      selectedSourceSongId={selectedSourceSongId}
      sourceSelectionEnabled={songs.find((song) => song.id === selectedSongId)?.mode === 'onomatopoeiaQuiz'}
      voicevoxBaseUrl={voicevoxBaseUrl}
      voicevoxStatus={voicevoxStatus}
      loading={loading}
      error={titleError}
      onSelectSong={setSelectedSongId}
      onSelectDataset={(datasetId) => {
        setSelectedDatasetId(datasetId);
        if (!supportsEnglishForDataset(datasetId)) setLanguage('ja');
      }}
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
