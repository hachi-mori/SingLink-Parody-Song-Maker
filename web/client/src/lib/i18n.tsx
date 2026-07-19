import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { languageStorageKey, resolveInitialLanguage, type AppLanguage } from '@shared/languageMode';

export type Language = AppLanguage;

const messages = {
  en: {
    appTitle: 'SingLink: Japanese Karaoke Learning',
    selectSongError: 'Choose a quiz to begin.',
    sourceSongMissing: 'The selected source song could not be found.',
    voicevoxChecking: 'Checking VOICEVOX...',
    voicevoxNotChecked: 'VOICEVOX has not been checked. It is not required for the instant demo.',
    voicevoxConnected: 'VOICEVOX connected{version}',
    voicevoxDisconnected: 'VOICEVOX is offline. You can still take the quiz; singing requires the local app.',
    voicevoxUrl: 'VOICEVOX URL',
    recheck: 'Check again',
    language: 'Language',
    credits: 'Credits',
    quizType: 'Quiz',
    chooseQuiz: 'Choose a quiz',
    sourceSong: 'Karaoke song',
    sourceSongHelp: 'Choose from five familiar melodies.',
    sourceSongDisabled: 'Available for the onomatopoeia quiz.',
    titleMenu: 'Main menu',
    story: 'Story',
    start: 'Start quiz',
    instantDemo: 'Try instant demo',
    instantDemoHelp: 'No VOICEVOX setup needed',
    demoLoadError: 'The instant demo could not be loaded.',
    demoLabel: 'Pre-generated demo',
    demoDisclosure: 'This is a pre-generated demo sample. In normal mode, the singing voice is generated in real time from your quiz answers.',
    demoEyebrow: 'See the complete karaoke learning experience instantly',
    demoSongTitle: 'Zundamon sings four original examples',
    howTo: 'How to play',
    savedSongs: 'Saved songs',
    noQuestions: 'No questions are available',
    noQuestionsHelp: 'Check the song data and dictionary files.',
    backToTitle: 'Back to title',
    fillBlank: 'Which onomatopoeia fits in ○○?',
    answerPlaceholder: 'Type in hiragana',
    submit: 'Submit',
    timeUp: 'Time up!',
    correct: 'Correct!',
    incorrect: 'Not quite',
    prompt: 'Sentence',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    unanswered: 'No answer',
    next: 'Next',
    preparingVoice: 'Zundamon is warming up to sing!',
    requestingVoice: 'VOICEVOX is creating the song...',
    generationTimeout: 'Voice generation is taking too long, so the result is shown without audio. You can still review the quiz answers.',
    generationOffline: 'VOICEVOX is offline, so voice generation was skipped. You can still review the quiz answers.',
    skipVoice: 'View result without audio',
    backToQuiz: 'Back to quiz',
    generationSkippedFallback: 'VOICEVOX could not be reached, so voice generation was skipped.',
    accompanimentError: 'Could not load the accompaniment: {detail}',
    skippedAudioError: 'There is no audio because voice generation was skipped.',
    voiceDataError: 'Could not load the singing voice.',
    playbackError: 'Audio could not be played. Press Play again.',
    songSourceEyebrow: 'Your four answers, sung karaoke-style',
    songMadeWith: 'Sung to {song}',
    play: 'Play',
    pause: 'Pause',
    restart: 'Sing again',
    download: 'Download',
    history: 'History',
    audioSkipped: 'Voice generation was skipped',
    lyricsStillAvailable: 'You can still review the lyrics and subtitles here.',
    translationUnavailable: 'Translation unavailable',
    pendingLyric: 'Not sung yet',
    currentLyric: 'Now singing',
    completedLyric: 'Sung',
    savedInBrowser: 'Singing voices saved in this browser',
    generationHistory: 'Generation history',
    noHistory: 'No singing voices have been saved yet.',
    downloadWav: 'Download WAV',
    selectHistory: 'Choose an item to see its lyrics and audio player.',
    delete: 'Delete',
    storyTitle: 'Why karaoke?',
    storyBody: 'Answer four Japanese onomatopoeia questions. Zundamon then sings the correct example sentences while Japanese lyrics light up and English subtitles explain their meaning.',
    howToTitle: 'How to play',
    howToBody: '1. Choose one of five melodies. 2. Answer four Japanese onomatopoeia questions. 3. Zundamon sings the correct Japanese sentences. 4. Follow the Japanese lyrics as they light up, with English subtitles below.',
    howToEyebrow: 'Learn Japanese with karaoke',
    howToStepChooseTitle: 'Choose a melody',
    howToStepChooseBody: 'Pick one of five familiar karaoke songs.',
    howToStepAnswerTitle: 'Answer four questions',
    howToStepAnswerBody: 'Choose the onomatopoeia that completes each Japanese sentence.',
    howToStepListenTitle: 'Listen to Zundamon',
    howToStepListenBody: 'After the quiz, Zundamon sings the correct Japanese sentences.',
    howToStepFollowTitle: 'Follow the lyrics',
    howToStepFollowBody: 'Watch the Japanese words light up and read the English subtitles.',
    creditsTitle: 'Credits',
    creditsBody: 'This Build Week edition uses an original 335-card onomatopoeia dataset. The Japanese artwork below contains the original project credits.',
    japaneseReference: 'Original Japanese reference artwork',
    refreshFailed: 'Could not check VOICEVOX.',
    genericLoadError: 'The requested data could not be loaded.'
  },
  ja: {
    appTitle: 'シングリンク Web', selectSongError: '←きょくをえらんでね！', sourceSongMissing: 'もとの曲が見つかりませんでした',
    voicevoxChecking: 'VOICEVOX確認中...', voicevoxNotChecked: 'VOICEVOXは未確認です。すぐにデモを見る場合は不要です。', voicevoxConnected: 'VOICEVOX接続済み{version}', voicevoxDisconnected: 'VOICEVOX未接続: クイズは遊べます。歌声生成にはローカル版の起動が必要です。', voicevoxUrl: 'VOICEVOX URL', recheck: '再確認', language: '言語', credits: 'クレジット', quizType: 'あそぶ問題', chooseQuiz: '問題をえらんでね', sourceSong: 'もとの曲', sourceSongHelp: '5曲からもとの曲を選べます', sourceSongDisabled: 'オノマトペで選べます', titleMenu: 'タイトルメニュー', story: 'ストーリー', start: 'スタート', instantDemo: 'すぐにデモを見る', instantDemoHelp: 'VOICEVOXの準備は不要', demoLoadError: 'デモを読み込めませんでした。', demoLabel: '事前生成デモ', demoDisclosure: 'これは事前生成したデモサンプルです。通常モードでは、クイズの回答から歌声をリアルタイム生成します。', demoEyebrow: 'カラオケ学習の完成画面をすぐに体験', demoSongTitle: 'ずんだもんが自作例文4つを歌います', howTo: 'あそびかた', savedSongs: '保存した曲', noQuestions: 'お題がありません', noQuestionsHelp: '曲データか辞書CSVを確認してください。', backToTitle: 'タイトルへ', fillBlank: '○○に入るオノマトペは？', answerPlaceholder: 'ひらがなで入力', submit: '決定', timeUp: 'タイムアップ！', correct: 'せいかい！', incorrect: 'ふせいかい', prompt: 'おだい', yourAnswer: 'あなたのこたえ', correctAnswer: 'せいかい', unanswered: 'みかいとう', next: 'つぎへ', preparingVoice: 'ずんだもん が おうた を れんしゅう しているよ', requestingVoice: 'VOICEVOXに歌声をお願いしています...', generationTimeout: '歌声生成に時間がかかっているため、音声なしでリザルトを表示しました。クイズ結果は確認できます。', generationOffline: 'VOICEVOXに接続されていないため、音声生成をスキップしました。クイズ結果は確認できます。', skipVoice: '音声なしでリザルトを見る', backToQuiz: '入力画面へ戻る', generationSkippedFallback: 'VOICEVOXに接続できなかったため、音声生成をスキップしました。', accompanimentError: '伴奏を読み込めませんでした: {detail}', skippedAudioError: '音声生成をスキップしたため、再生できる音声はありません。', voiceDataError: '歌声データを読み込めませんでした。', playbackError: '音声を再生できませんでした。再生ボタンをもう一度押してください。', songSourceEyebrow: '4問の正しい例文をカラオケで復習', songMadeWith: '{song}の曲で歌っています', play: '再生', pause: '一時停止', restart: 'もう一度', download: 'ダウンロード', history: '履歴', audioSkipped: '音声生成をスキップしました', lyricsStillAvailable: '歌詞と字幕はこの画面で確認できます。', translationUnavailable: '英訳がありません', pendingLyric: 'まだ歌っていない', currentLyric: '歌唱中', completedLyric: '歌唱済み', savedInBrowser: 'ブラウザに保存された歌声', generationHistory: '生成履歴', noHistory: 'まだ保存された歌声がありません。', downloadWav: 'WAVをダウンロード', selectHistory: '履歴を選ぶと歌詞と再生プレイヤーが表示されます。', delete: '削除', storyTitle: 'ストーリー', storyBody: '4問のオノマトペクイズに答えると、ずんだもんが正しい例文を歌います。', howToTitle: 'あそびかた', howToBody: '曲を選び、4問に答え、光る歌詞と歌声で正しい例文を覚えます。', howToEyebrow: 'カラオケで日本語を学ぼう', howToStepChooseTitle: '曲をえらぶ', howToStepChooseBody: '5曲から好きな曲をえらびます。', howToStepAnswerTitle: '4問に答える', howToStepAnswerBody: '文に合うオノマトペをえらびます。', howToStepListenTitle: 'ずんだもんの歌を聞く', howToStepListenBody: 'クイズのあと、正しい例文をずんだもんが歌います。', howToStepFollowTitle: '歌詞を追いかける', howToStepFollowBody: '光る日本語の歌詞を見ながら復習します。', creditsTitle: 'クレジット', creditsBody: 'Build Week版は自作335教材を使用しています。下の画像は既存のクレジットです。', japaneseReference: '日本語の参考画像', refreshFailed: 'VOICEVOXを確認できませんでした。', genericLoadError: 'データを読み込めませんでした。'
  }
} as const;

export type MessageKey = keyof typeof messages.en;

function detectLanguage(): Language {
  try {
    return resolveInitialLanguage(window.localStorage.getItem(languageStorageKey));
  } catch {
    return 'en';
  }
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { window.localStorage.setItem(languageStorageKey, next); } catch { /* Storage can be unavailable. */ }
  };
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values = {}) => Object.entries(values).reduce(
      (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
      messages[language][key] as string
    )
  }), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = messages[language].appTitle;
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
