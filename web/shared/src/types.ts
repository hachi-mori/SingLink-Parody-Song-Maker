export type JsonObject = Record<string, unknown>;

export type ParsedTargetText = {
  baseText: string;
  particleText: string;
};

export type TalkProblem = {
  rawTargetText: string;
  baseTargetText: string;
  particleText: string;
  questionText: string;
  targetSyllables: string[];
  maxSyllableCount: number;
};

export type SolvedTask = {
  phrase: string;
  syllables: string[];
  userInput: string;
  userSyllables: string[];
  restPadding?: boolean;
  score?: number;
  rhymeMatchPercent?: number;
  matchesCount?: number;
  isCorrect?: boolean;
};

export type VerbEntry = {
  word: string;
  reading: string;
  group: string;
};

export type OnomatopoeiaEntry = {
  word: string;
  reading: string;
  answer: string;
  explanation: string;
  questionText?: string;
};

export type SongMode = 'freeText' | 'verbQuiz' | 'onomatopoeiaQuiz';

export type SongInfo = {
  id: string;
  title: string;
  vvprojFileName: string;
  vvprojUrl: string;
  instFileName?: string;
  instUrl?: string;
  mode: SongMode;
  trackName?: string;
};

export type SongDetail = SongInfo & {
  problems: TalkProblem[];
  verbEntries?: VerbEntry[];
  onomatopoeiaEntries?: OnomatopoeiaEntry[];
};

export type SynthesisRequest = {
  songId: string;
  solvedTasks: SolvedTask[];
  fullLyrics: string;
  voicevoxBaseUrl?: string;
};

export type SynthesisErrorResponse = {
  ok: false;
  message: string;
  detail?: string;
};

export type VoicevoxVersionResponse = {
  ok: boolean;
  version?: string;
  baseUrl: string;
  message: string;
};

export type GeneratedTrackRecord = {
  id: string;
  songTitle: string;
  fileName: string;
  createdAt: string;
  lyrics: string;
  userInputs: string[];
  voicevoxBaseUrl: string;
  wavBlob: Blob;
};
