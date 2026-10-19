import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { languageStorageKey, resolveInitialLanguage, type AppLanguage } from '@shared/languageMode';

export type Language = AppLanguage;

const messages = {
  en: {
    appTitle: 'SingLink: Japanese Karaoke Learning',
    selectSongError: 'Choose a quiz to begin.',
    sourceSongMissing: 'The selected source song could not be found.',
    voicevoxChecking: 'Checking VOICEVOX...',
    voicevoxLocalNotChecked: 'VOICEVOX has not been checked.',
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
    instantDemo: 'Try fixed quiz demo',
    instantDemoHelp: 'Answer four fixed questions — no VOICEVOX setup needed',
    demoLoadError: 'The fixed quiz demo could not be loaded.',
    demoLabel: 'Pre-generated demo',
    demoDisclosure: 'This is a pre-generated demo sample. In normal mode, the singing voice is generated in real time from your quiz answers.',
    demoEyebrow: 'Answer the fixed quiz, then hear the complete karaoke experience',
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
    songMadeWith: 'Review with {song}',
    quizResultTitle: 'Quiz results',
    quizResultEyebrow: 'Review the four correct sentences',
    playbackReady: 'Ready to play',
    playbackPlaying: 'Playing',
    playbackPaused: 'Paused',
    playbackEnded: 'Playback finished',
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
    howToStepAnswerBody: 'Choose from three answers to complete each Japanese sentence. Review the feedback, then select Next. There are four questions.',
    howToStepListenTitle: 'Listen to Zundamon',
    howToStepListenBody: 'When VOICEVOX is connected, press Play on the result screen to hear Zundamon sing the correct sentences. Without audio, you can still review every answer.',
    howToStepFollowTitle: 'Follow the lyrics',
    howToStepFollowBody: 'Watch the Japanese words light up and read the English subtitles.',
    creditsTitle: 'Credits',
    creditsBody: 'This Build Week edition uses an original 335-card onomatopoeia dataset. The Japanese artwork below contains the original project credits.',
    japaneseReference: 'Original Japanese reference artwork',
    refreshFailed: 'Could not check VOICEVOX.',
    genericLoadError: 'The requested data could not be loaded.'
  },
  ja: {
    quizResultTitle: 'クイズの結果',
    quizResultEyebrow: '4問の正しい例文を復習',
    playbackReady: '再生できます',
    playbackPlaying: '再生中',
    playbackPaused: '一時停止中',
    playbackEnded: '再生が終わりました',
    appTitle: 'シングリンク', selectSongError: '問題をえらんでね。', sourceSongMissing: 'もとの曲が見つかりませんでした',
    voicevoxLocalNotChecked: 'VOICEVOXをまだ確認していません',
    voicevoxChecking: 'VOICEVOXを確認しています', voicevoxNotChecked: 'VOICEVOXは未確認です。固定問題デモでは不要です。', voicevoxConnected: 'VOICEVOXにつながりました{version}', voicevoxDisconnected: 'VOICEVOXにつながっていません', voicevoxUrl: 'VOICEVOX URL', recheck: 'もう一度確認', language: '言語', credits: 'クレジット', quizType: 'あそぶ問題', chooseQuiz: '問題をえらんでね', sourceSong: 'もとの曲', sourceSongHelp: '5曲からもとの曲を選べます', sourceSongDisabled: 'オノマトペで選べます', titleMenu: 'タイトルメニュー', story: 'ストーリー', start: 'スタート', instantDemo: '固定問題デモを遊ぶ', instantDemoHelp: '固定4問に答える・VOICEVOXの準備は不要', demoLoadError: '固定問題デモを読み込めませんでした。', demoLabel: '事前生成デモ', demoDisclosure: 'これは事前生成したデモサンプルです。通常モードでは、クイズの回答から歌声をリアルタイム生成します。', demoEyebrow: '固定問題に答えたあと、カラオケ学習を体験', demoSongTitle: 'ずんだもんが自作例文4つを歌います', howTo: 'あそびかた', savedSongs: '保存した曲', noQuestions: 'お題がありません', noQuestionsHelp: '曲データか辞書CSVを確認してください。', backToTitle: 'タイトルへ', fillBlank: '○○に入るオノマトペは？', answerPlaceholder: 'ひらがなで入力', submit: '決定', timeUp: 'タイムアップ！', correct: 'せいかい！', incorrect: 'ふせいかい', prompt: 'おだい', yourAnswer: 'あなたのこたえ', correctAnswer: 'せいかい', unanswered: 'こたえなし', next: 'つぎへ', preparingVoice: 'ずんだもん が おうた を れんしゅう しているよ', requestingVoice: '歌を作っています', generationTimeout: '時間がかかっているため、歌声なしで進みます。', generationOffline: 'VOICEVOXにつながらないため、今回は歌声なしです。', skipVoice: '歌声なしで進む', backToQuiz: '問題にもどる', generationSkippedFallback: 'VOICEVOXにつながりませんでした。', accompanimentError: '伴奏を読み込めませんでした: {detail}', skippedAudioError: '今回は歌声がありません。', voiceDataError: '歌声データを読み込めませんでした。', playbackError: '音声を再生できませんでした。再生ボタンをもう一度押してください。', songSourceEyebrow: '4問の正しい例文をカラオケで復習', songMadeWith: '「{song}」の歌', play: '再生', pause: '一時停止', restart: 'もう一度', download: 'ダウンロード', history: '保存した曲', audioSkipped: '今回は歌声なしです', lyricsStillAvailable: '歌詞と字幕はこの画面で確認できます。', translationUnavailable: '英訳がありません', pendingLyric: 'まだ歌っていない', currentLyric: '歌唱中', completedLyric: '歌唱済み', savedInBrowser: 'ブラウザに保存された歌声', generationHistory: '保存した曲', noHistory: 'まだ保存した曲はありません。', downloadWav: 'WAVをダウンロード', selectHistory: '聞きたい曲をえらんでね。', delete: '消す', storyTitle: 'ストーリー', storyBody: '4問のオノマトペクイズに答えると、ずんだもんが正しい例文を歌います。', howToTitle: 'あそびかた', howToBody: '曲を選び、4問に答え、光る歌詞と歌声で正しい例文を覚えます。', howToEyebrow: 'カラオケで日本語を学ぼう', howToStepChooseTitle: '曲をえらぶ', howToStepChooseBody: '5曲から好きな曲をえらびます。', howToStepAnswerTitle: '4問に答える', howToStepAnswerBody: '3つのこたえからえらびます。こたえを見たら「つぎへ」。全部で4問です。', howToStepListenTitle: '歌を聞く', howToStepListenBody: '「再生」を押すと、ずんだもんが歌います。', howToStepFollowTitle: '歌詞を見る', howToStepFollowBody: '光る歌詞を見ながら聞きます。', creditsTitle: 'クレジット', creditsBody: 'Build Week版は自作335教材を使用しています。下の画像は既存のクレジットです。', japaneseReference: '日本語の参考画像', refreshFailed: 'VOICEVOXを確認できませんでした。', genericLoadError: 'データを読み込めませんでした。'
  }
} as const;

export type MessageKey = keyof typeof messages.en;

function detectLanguage(): Language {
  try {
    return resolveInitialLanguage(window.localStorage.getItem(languageStorageKey));
  } catch {
    return 'ja';
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
    const fixedLanguage = resolveInitialLanguage(next);
    setLanguageState(fixedLanguage);
    try { window.localStorage.setItem(languageStorageKey, fixedLanguage); } catch { /* Storage can be unavailable. */ }
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
    try { window.localStorage.setItem(languageStorageKey, language); } catch { /* Storage can be unavailable. */ }
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
