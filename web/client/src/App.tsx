import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defaultMemorizationSourceSongId } from '@shared/memorizationSongs';
import type { DatasetId, OnomatopoeiaEntry, SolvedTask, SongDetail, SongInfo, VoicevoxVersionResponse } from '@shared/types';
import { fetchSongDetail, fetchSongs, checkVoicevox } from './lib/api';
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
import { browserImportDataset, original335Dataset, readImportedDataset, supportsEnglishForDataset } from './lib/quizDatasets';

type Screen = 'title' | 'write' | 'loading' | 'result' | 'howto' | 'credit' | 'history';

export function App() {
  const { language, setLanguage, t } = useLanguage();
  const sourceSongs = getStaticMemorizationSourceSongs();
  const demoRequested = new URLSearchParams(window.location.search).get('demo') === '1';
  const [screen, setScreen] = useState<Screen>('title');
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [importedEntries, setImportedEntries] = useState<OnomatopoeiaEntry[]>();
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
  const importGenerationRef = useRef(0);
  const connectionGenerationRef = useRef(0);
  const datasets = importedEntries ? [original335Dataset, browserImportDataset] : [original335Dataset];

  useLayoutEffect(() => {
    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    main.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const target = main.querySelector<HTMLElement>('h1') ?? main;
    const previousTabIndex = target.getAttribute('tabindex');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return () => {
      if (previousTabIndex === null) target.removeAttribute('tabindex');
      else target.setAttribute('tabindex', previousTabIndex);
    };
  }, [screen]);

  const refreshVoicevox = useCallback(async () => {
    const generation = ++connectionGenerationRef.current;
    const status = await checkVoicevox(voicevoxBaseUrl, selectedDatasetId);
    if (generation === connectionGenerationRef.current) setVoicevoxStatus(status);
  }, [voicevoxBaseUrl, selectedDatasetId]);

  const clearRound = () => {
    setSongDetail(undefined);
    setSolvedTasks([]);
    setFullLyrics('');
    setInputTexts([]);
    if (generatedResult?.status === 'generated') URL.revokeObjectURL(generatedResult.blobUrl);
    setGeneratedResult(undefined);
    setDemoInfo(undefined);
    setDemoBundle(undefined);
    setActiveDatasetId('original335');
  };

  const importDataset = async (file: File) => {
    const generation = ++importGenerationRef.current;
    setLoading(true);
    setTitleError('');
    try {
      const entries = await readImportedDataset(file);
      if (generation !== importGenerationRef.current) return;
      clearRound();
      setImportedEntries(entries);
      setSelectedDatasetId('browserImport');
      setSelectedSongId(songs.find((song) => song.mode === 'onomatopoeiaQuiz')?.id ?? '');
      setLanguage('ja');
      connectionGenerationRef.current += 1;
      setVoicevoxBaseUrl('http://localhost:50021');
      setVoicevoxStatus(undefined);
    } catch (error) {
      if (generation === importGenerationRef.current) {
        setTitleError(error instanceof Error ? error.message : '教材を読み込めませんでした。現在の教材は変更していません。');
      }
    } finally {
      if (generation === importGenerationRef.current) setLoading(false);
    }
  };

  const clearImportedDataset = () => {
    importGenerationRef.current += 1;
    clearRound();
    setImportedEntries(undefined);
    setSelectedDatasetId('original335');
    setTitleError('');
    setLoading(false);
    setScreen('title');
  };

  const startDemo = useCallback(async () => {
    setLoading(true);
    setTitleError('');
    try {
      const demo = await loadDemoBundle();
      setSongs([demo.song]);
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
        setSongs(await fetchSongs());
      } catch (error) {
        setTitleError(language === 'en' ? t('genericLoadError') : error instanceof Error ? error.message : String(error));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (selectedDatasetId === 'browserImport' && language !== 'ja') {
      setLanguage('ja');
    }
  }, [selectedDatasetId, language, setLanguage]);

  useEffect(() => {
    if (selectedDatasetId === 'browserImport' && !selectedSongId) {
      setSelectedSongId(songs.find((song) => song.mode === 'onomatopoeiaQuiz')?.id ?? '');
    }
  }, [selectedDatasetId, selectedSongId, songs]);

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
      const imported = selectedDatasetId === 'browserImport';
      const importedSong = songs.find((song) => song.id === selectedSongId && song.mode === 'onomatopoeiaQuiz');
      if (imported && (!importedSong || !importedEntries)) {
        throw new Error('教材を読み込み、オノマトペクイズを選んでください。');
      }
      // Imported rounds use existing metadata and local question data. Only
      // synthesis may later send text to the strictly validated loopback engine.
      const detail: SongDetail = imported
        ? { ...importedSong!, problems: [], onomatopoeiaEntries: importedEntries }
        : await fetchSongDetail(selectedSongId);
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
    return <HowToScreen onBack={() => setScreen('title')} />;
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
      importedEntryCount={importedEntries?.length}
      importedSingingReadingCount={importedEntries?.filter((entry) => entry.singingReading).length}
      onImportDataset={importDataset}
      onClearImportedDataset={clearImportedDataset}
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
        clearRound();
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
