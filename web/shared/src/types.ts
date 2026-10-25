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
  singingReading?: string;
  englishMeaning?: string;
  englishExample?: string;
};

export type VerbEntry = {
  word: string;
  reading: string;
  group: string;
};

export type OnomatopoeiaEntry = {
  /** Present only on a validated, fixed experience set. */
  id?: string;
  choices?: string[];
  word: string;
  reading: string;
  answer: string;
  explanation: string;
  questionText?: string;
  displayText?: string;
  singingReading?: string;
  englishMeaning?: string;
  englishExample?: string;
  translationReviewStatus?: 'reviewed' | 'needsReview';
  translationReviewNote?: string;
};

export type ExperienceSetInfo = {
  setId: string;
  title: string;
};

/** Imported data may use only loopback synthesis and browser-local history. */
export type DatasetId = 'original335' | 'browserImport';

/** Metadata safe to expose in the title screen; it never contains card text. */
export type QuizDataset = {
  id: DatasetId;
  label: string;
  localOnly: boolean;
  supportsEnglish: boolean;
};

/** A quiz round, with its data handling policy. */
export type QuizRound = {
  datasetId: DatasetId;
  entries: OnomatopoeiaEntry[];
};

export type KaraokeNoteTiming = {
  lyric: string;
  startSeconds: number;
  endSeconds: number;
  startProgress: number;
  endProgress: number;
};

export type KaraokeLineTiming = {
  startSeconds: number;
  endSeconds: number;
  noteTimings: KaraokeNoteTiming[];
};

export type SongMode = 'freeText' | 'verbQuiz' | 'onomatopoeiaQuiz';

export type SongInfo = {
  id: string;
  title: string;
  vvprojFileName: string;
  vvprojUrl: string;
  instFileName?: string;
  instUrl?: string;
  baseScoreFileName?: string;
  baseScoreUrl?: string;
  mode: SongMode;
  trackName?: string;
};

export type SourceSongInfo = {
  id: string;
  title: string;
  scoreFileName: string;
  scoreUrl: string;
  instFileName: string;
  instUrl: string;
};

export type SongDetail = SongInfo & {
  problems: TalkProblem[];
  verbEntries?: VerbEntry[];
  onomatopoeiaEntries?: OnomatopoeiaEntry[];
  experienceSet?: ExperienceSetInfo;
  sourceSong?: SourceSongInfo;
};

export type SynthesisRequest = {
  datasetId?: DatasetId;
  songId: string;
  sourceSongId?: string;
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
  /** Absent only for records created before dataset provenance was recorded. */
  datasetId?: DatasetId;
  id: string;
  songTitle: string;
  fileName: string;
  createdAt: string;
  lyrics: string;
  userInputs: string[];
  voicevoxBaseUrl: string;
  wavBlob: Blob;
};
