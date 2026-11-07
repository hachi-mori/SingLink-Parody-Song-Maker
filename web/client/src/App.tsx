import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defaultMemorizationSourceSongId } from '@shared/memorizationSongs';
import type { DatasetId, SolvedTask, SongDetail, SongInfo } from '@shared/types';
import { fetchSongDetail, fetchSongs, checkVoicevox, type VoicevoxCheckResult } from './lib/api';
import { queryLoopbackPermission, usesDirectVoicevox } from './lib/localVoicevox';
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
import { useLanguage, voicevoxFailureMessages } from './lib/i18n';
import { loadDemoBundle, type DemoBundle } from './lib/demo';
import { completeFixedDemo, getFixedDemoQuestions } from './lib/demoFlow';
import { browserImportDataset, original335Dataset, readImportedMaterial, supportsEnglishForDataset, type ImportedMaterial } from './lib/quizDatasets';

type Screen = 'title' | 'write' | 'loading' | 'result' | 'howto' | 'credit' | 'history';
const defaultVoicevoxBaseUrl = 'http://localhost:50021';

export function App() {
  const { language, setLanguage, t } = useLanguage();
  const sourceSongs = getStaticMemorizationSourceSongs();
  const demoRequested = new URLSearchParams(window.location.search).get('demo') === '1';
  const [screen, setScreen] = useState<Screen>('title');
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [importedMaterial, setImportedMaterial] = useState<ImportedMaterial>();
  const importedEntries = importedMaterial?.entries;
  const [selectedDatasetId, setSelectedDatasetId] = useState<DatasetId>('original335');
  const [activeDatasetId, setActiveDatasetId] = useState<DatasetId>('original335');
  const [selectedSongId, setSelectedSongId] = useState('');
  const [selectedSourceSongId, setSelectedSourceSongId] = useState(defaultMemorizationSourceSongId);
  const [songDetail, setSongDetail] = useState<SongDetail>();
  const [voicevoxBaseUrl, setVoicevoxBaseUrl] = useState(defaultVoicevoxBaseUrl);
  const [voicevoxStatus, setVoicevoxStatus] = useState<VoicevoxCheckResult>();
  const [checkingVoicevox, setCheckingVoicevox] = useState(false);
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
  const generationRetryRef = useRef<object | undefined>(undefined);
  useEffect(() => () => { generationRetryRef.current = undefined; }, []);
  const datasets = importedEntries ? [original335Dataset, {
    ...browserImportDataset,
    label: importedMaterial?.experienceSet?.title ?? browserImportDataset.label
  }] : [original335Dataset];

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

  const resetVoicevoxCheck = () => {
    connectionGenerationRef.current += 1;
    setCheckingVoicevox(false);
    setVoicevoxStatus(undefined);
  };

  const refreshVoicevox = useCallback(async (baseUrl: string, datasetId: DatasetId, mode?: 'automatic') => {
    const generation = ++connectionGenerationRef.current;
    setVoicevoxBaseUrl(baseUrl);
    setVoicevoxStatus(undefined);
    setCheckingVoicevox(true);
    try {
      const status = mode === 'automatic'
        ? await checkVoicevox(baseUrl, datasetId, mode)
        : await checkVoicevox(baseUrl, datasetId);
      if (generation === connectionGenerationRef.current) setVoicevoxStatus(status);
    } catch {
      if (generation === connectionGenerationRef.current) {
        setVoicevoxStatus({ ok: false, baseUrl, message: '', failure: 'networkError' });
      }
    } finally {
      if (generation === connectionGenerationRef.current) setCheckingVoicevox(false);
    }
  }, []);

  useEffect(() => {
    if (demoRequested || !usesDirectVoicevox('original335')) return;
    let cancelled = false;
    const generation = connectionGenerationRef.current;
    void queryLoopbackPermission().then((permission) => {
      if (cancelled || generation !== connectionGenerationRef.current) return;
      if (permission === 'granted') void refreshVoicevox(defaultVoicevoxBaseUrl, 'original335', 'automatic');
      if (permission === 'denied') {
        setVoicevoxStatus({ ok: false, baseUrl: defaultVoicevoxBaseUrl, message: '', failure: 'permissionDenied' });
      }
    });
    return () => { cancelled = true; };
  }, [demoRequested, refreshVoicevox]);

  const cancelGenerationRetry = () => {
    generationRetryRef.current = undefined;
    setLoading(false);
  };

  const retrySong = async () => {
    if (generationRetryRef.current || !songDetail || generatedResult?.status !== 'skipped') return;
    const request = {};
    generationRetryRef.current = request;
    resetVoicevoxCheck();
    setLoading(true);
    try {
      const status = await checkVoicevox(voicevoxBaseUrl, activeDatasetId);
      if (generationRetryRef.current !== request) return;
      setVoicevoxStatus(status);
      if (!status.ok) {
        setGeneratedResult({
          status: 'skipped',
          message: voicevoxFailureMessages(status, activeDatasetId === 'browserImport', t).join(' ')
        });
        return;
      }
      setGeneratedResult(undefined);
      setScreen('loading');
    } catch {
      if (generationRetryRef.current === request) {
        setGeneratedResult({ status: 'skipped', message: t('refreshFailed') });
      }
    } finally {
      if (generationRetryRef.current === request) {
        generationRetryRef.current = undefined;
        setLoading(false);
      }
    }
  };

  const clearRound = () => {
    cancelGenerationRetry();
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
      const material = await readImportedMaterial(file);
      if (generation !== importGenerationRef.current) return;
      clearRound();
      setImportedMaterial(material);
      setSelectedDatasetId('browserImport');
      setSelectedSongId(songs.find((song) => song.mode === 'onomatopoeiaQuiz')?.id ?? '');
      setLanguage('ja');
      resetVoicevoxCheck();
      setVoicevoxBaseUrl(defaultVoicevoxBaseUrl);
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
    resetVoicevoxCheck();
    setImportedMaterial(undefined);
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
      if (usesDirectVoicevox(selectedDatasetId) && !checkingVoicevox && !voicevoxStatus?.ok) {
        void refreshVoicevox(voicevoxBaseUrl, selectedDatasetId);
      }
      // Imported rounds use existing metadata and local question data. Only
      // synthesis may later send text to the strictly validated loopback engine.
      const detail: SongDetail = imported
        ? { ...importedSong!, problems: [], onomatopoeiaEntries: importedEntries, experienceSet: importedMaterial?.experienceSet }
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
        voicevoxChecking={checkingVoicevox}
        voicevoxFailureMessage={voicevoxStatus?.ok === false
          ? voicevoxFailureMessages(voicevoxStatus, activeDatasetId === 'browserImport', t).join(' ')
          : undefined}
        voicevoxConnected={voicevoxStatus?.ok ?? (usesDirectVoicevox(activeDatasetId) ? undefined : true)}
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
        onTitle={() => { cancelGenerationRetry(); setScreen('title'); }}
        onRetry={retrySong}
        retrying={loading}
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
    return <StaticImageScreen title={t('creditsTitle')} imageSrc={assetUrl('assets/texture/assets/credit.png')} onBack={() => setScreen('title')} />;
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
      importedExperienceSet={importedMaterial?.experienceSet}
      importedSingingReadingCount={importedEntries?.filter((entry) => entry.singingReading).length}
      onImportDataset={importDataset}
      onClearImportedDataset={clearImportedDataset}
      selectedSongId={selectedSongId}
      sourceSongs={sourceSongs}
      selectedSourceSongId={selectedSourceSongId}
      sourceSelectionEnabled={songs.find((song) => song.id === selectedSongId)?.mode === 'onomatopoeiaQuiz'}
      voicevoxBaseUrl={voicevoxBaseUrl}
      voicevoxStatus={voicevoxStatus}
      checkingVoicevox={checkingVoicevox}
      checksVoicevoxOnStart={usesDirectVoicevox(selectedDatasetId) && !checkingVoicevox && !voicevoxStatus?.ok}
      loading={loading}
      error={titleError}
      onSelectSong={setSelectedSongId}
      onSelectDataset={(datasetId) => {
        clearRound();
        resetVoicevoxCheck();
        setSelectedDatasetId(datasetId);
        if (!supportsEnglishForDataset(datasetId)) setLanguage('ja');
      }}
      onSelectSourceSong={setSelectedSourceSongId}
      onBaseUrlChange={(baseUrl) => {
        resetVoicevoxCheck();
        setVoicevoxBaseUrl(baseUrl);
      }}
      onCheckVoicevox={(baseUrl) => { void refreshVoicevox(baseUrl, selectedDatasetId); }}
      onStart={startGame}
      onOpenHowTo={() => setScreen('howto')}
      onOpenCredit={() => setScreen('credit')}
      onOpenHistory={() => setScreen('history')}
    />
  );
}
