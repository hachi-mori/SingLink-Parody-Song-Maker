import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  buildOnomatopoeiaResultLyrics,
  buildOnomatopoeiaTasks,
  buildVerbSolvedTask,
  findVerbEntries,
  makeQuestionDisplayText,
  makeTimedOutTask,
  parseQuestionVerbGroup,
  validateAndBuildSolvedTask
} from '@shared/gameLogic';
import type { DatasetId, OnomatopoeiaEntry, SolvedTask, SongDetail, VerbEntry } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { previewLyrics } from '../lib/api';
import { assetUrl } from '../lib/assets';
import { shuffle } from '../lib/random';
import { prepareOnomatopoeiaOptions, selectOnomatopoeiaQuestions } from '../lib/quizSelection';
import { useLanguage } from '../lib/i18n';
import { supportsEnglishForDataset } from '../lib/quizDatasets';
import { createQuestionGate } from '../lib/questionGate';
import { SoundToggle } from '../components/SoundToggle';
import { useSoundEffects } from '../lib/soundEffectsContext';

type WriteLyricsScreenProps = {
  song: SongDetail;
  datasetId: DatasetId;
  fixedOnomatopoeiaEntries?: OnomatopoeiaEntry[];
  onComplete: (tasks: SolvedTask[], fullLyrics: string, inputTexts: string[]) => void;
  onCancel: () => void;
};

const timeLimit = 60;
const countdownSeconds = 3;
const onomatopoeiaTimeoutAnswer = 'ら'.repeat(6);

type AnswerFeedback = {
  active: true;
  correct: boolean;
  timeUp: boolean;
  question: string;
  selected: string;
  correctAnswer: string;
  explanation: string;
  answerForRecord: string;
};

function preventRepeatedActivation(event: KeyboardEvent<HTMLElement>) {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
}

function useTick(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const id = window.setInterval(() => setTick((value) => value + 1), 250);
    return () => window.clearInterval(id);
  }, [active]);
}

function prepareVerbOptions(entries: VerbEntry[], questionText: string, maxSyllables: number): { options: VerbEntry[]; correctIndex: number } | undefined {
  const group = parseQuestionVerbGroup(questionText);
  if (!group) {
    return undefined;
  }
  const correctEntries = shuffle(findVerbEntries(entries, group, maxSyllables, true));
  const wrongEntries = shuffle(findVerbEntries(entries, group, maxSyllables, false));
  if (!correctEntries[0] || wrongEntries.length < 2) {
    return undefined;
  }
  const correct = correctEntries[0];
  const options = shuffle([correct, wrongEntries[0] as VerbEntry, wrongEntries[1] as VerbEntry]);
  return {
    options,
    correctIndex: options.findIndex((entry) => entry.word === correct.word && entry.reading === correct.reading && entry.group === correct.group)
  };
}

export function WriteLyricsScreen({ song, datasetId, fixedOnomatopoeiaEntries, onComplete, onCancel }: WriteLyricsScreenProps) {
  const { language, t } = useLanguage();
  const { play: playSound } = useSoundEffects();
  const showEnglishLearningSupport = supportsEnglishForDataset(datasetId) && language === 'en';
  const [countdownStartedAt] = useState(() => Date.now());
  const [started, setStarted] = useState(false);
  const [problemStartedAt, setProblemStartedAt] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<SolvedTask[]>([]);
  const [inputTexts, setInputTexts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<Readonly<AnswerFeedback>>();
  const questionGate = useRef(createQuestionGate<AnswerFeedback>());
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const gameCardRef = useRef<HTMLElement>(null);
  const feedbackTitleId = useId();

  const onomatopoeiaProblems = useMemo(
    () => selectOnomatopoeiaQuestions(song, fixedOnomatopoeiaEntries),
    [song, fixedOnomatopoeiaEntries]
  );

  const problemCount = song.mode === 'onomatopoeiaQuiz' ? onomatopoeiaProblems.length : song.problems.length;
  const currentProblem = song.problems[currentIndex];
  const currentOnomatopoeia = onomatopoeiaProblems[currentIndex];
  const verbOptions = useMemo(() => {
    if (song.mode !== 'verbQuiz' || !currentProblem) {
      return undefined;
    }
    return prepareVerbOptions(song.verbEntries ?? [], currentProblem.questionText, Math.max(2, currentProblem.maxSyllableCount));
  }, [song, currentProblem]);
  const onomatopoeiaOptions = useMemo(() => {
    if (song.mode !== 'onomatopoeiaQuiz' || !currentOnomatopoeia) {
      return undefined;
    }
    return prepareOnomatopoeiaOptions(song.onomatopoeiaEntries ?? [], currentOnomatopoeia);
  }, [song, currentOnomatopoeia]);

  const settlement = questionGate.current.get(currentIndex);
  const answerLocked = settlement !== undefined;
  useTick(!started || !answerLocked);

  useEffect(() => {
    if (feedback?.active) {
      nextButtonRef.current?.focus();
    } else if (started && !answerLocked) {
      gameCardRef.current?.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')?.focus();
    }
  }, [feedback, started, currentIndex, answerLocked]);

  useEffect(() => {
    if (started) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      setStarted(true);
      setProblemStartedAt(Date.now());
    }, countdownSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [started]);

  const elapsedSeconds = started ? Math.floor(((settlement?.settledAt ?? Date.now()) - problemStartedAt) / 1000) : 0;
  const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);

  const finish = async (nextTasks: SolvedTask[], nextInputTexts: string[]) => {
    if (song.mode === 'onomatopoeiaQuiz') {
      onComplete(nextTasks, buildOnomatopoeiaResultLyrics(onomatopoeiaProblems), nextInputTexts);
      return;
    }

    try {
      const lyrics = await previewLyrics(song.id, nextTasks, datasetId);
      onComplete(nextTasks, lyrics, nextInputTexts);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : String(previewError));
    }
  };

  const advance = (task: SolvedTask, displayText: string) => {
    const nextTasks = [...tasks, task];
    const nextInputTexts = [...inputTexts, displayText];
    setTasks(nextTasks);
    setInputTexts(nextInputTexts);
    setInput('');
    setError('');

    if (currentIndex + 1 >= problemCount) {
      void finish(nextTasks, nextInputTexts);
    } else {
      setCurrentIndex((index) => index + 1);
      setProblemStartedAt(Date.now());
    }
  };

  const settleOnomatopoeia = (answer?: string) => {
    if (!started || !currentOnomatopoeia || questionGate.current.get(currentIndex)) return;
    const now = Date.now();
    const deadline = problemStartedAt + timeLimit * 1000;
    const timeUp = now >= deadline;
    if (answer === undefined && !timeUp) return;
    const accepted = questionGate.current.settle(currentIndex, {
      active: true,
      correct: !timeUp && answer === currentOnomatopoeia.answer,
      timeUp,
      question: currentOnomatopoeia.questionText ?? currentOnomatopoeia.word,
      selected: timeUp ? t('unanswered') : answer!,
      correctAnswer: currentOnomatopoeia.answer,
      explanation: showEnglishLearningSupport
        ? currentOnomatopoeia.englishMeaning ?? t('translationUnavailable')
        : currentOnomatopoeia.explanation,
      answerForRecord: timeUp ? onomatopoeiaTimeoutAnswer : answer!
    }, timeUp ? deadline : now);
    if (accepted) {
      setFeedback(accepted.value);
      playSound(accepted.value.correct ? 'correct' : 'incorrect');
    }
  };

  useEffect(() => {
    if (!started || feedback?.active || problemCount === 0 || remainingSeconds > 0) {
      return;
    }
    if (song.mode === 'onomatopoeiaQuiz' && currentOnomatopoeia) {
      settleOnomatopoeia();
      return;
    }
    if (currentProblem) {
      advance(makeTimedOutTask(currentProblem), 'タイムアップ');
    }
  }, [started, feedback, remainingSeconds, problemCount, song.mode, currentOnomatopoeia, currentProblem, showEnglishLearningSupport, t]);

  const submitFreeText = () => {
    if (!currentProblem) {
      return;
    }
    const result = validateAndBuildSolvedTask(currentProblem, input.trim(), input.trim());
    if (!result.ok) {
      setError(result.message);
      return;
    }
    advance(result.task, input.trim());
  };

  const submitVerb = (entry: VerbEntry, index: number) => {
    if (!currentProblem || !verbOptions) {
      return;
    }
    if (index !== verbOptions.correctIndex) {
      setError('ざんねん！ 問題のグループに合う動詞を選んでね');
      playSound('incorrect');
      return;
    }
    const result = buildVerbSolvedTask(currentProblem, entry);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    playSound('correct');
    advance(result.task, entry.word);
  };

  const submitOnomatopoeia = (answer: string) => {
    settleOnomatopoeia(answer);
  };

  const advanceFeedback = () => {
    if (!currentOnomatopoeia) {
      return;
    }
    const accepted = questionGate.current.consume(currentIndex);
    if (!accepted) return;
    const recordedFeedback = accepted.value;
    const generatedTasks = buildOnomatopoeiaTasks(currentOnomatopoeia, recordedFeedback.answerForRecord, recordedFeedback.correct);
    const nextTasks = [...tasks, ...generatedTasks];
    const nextInputTexts = [...inputTexts, currentOnomatopoeia.word, recordedFeedback.answerForRecord];
    setFeedback(undefined);
    setTasks(nextTasks);
    setInputTexts(nextInputTexts);
    setError('');

    if (currentIndex + 1 >= problemCount) {
      void finish(nextTasks, nextInputTexts);
    } else {
      setCurrentIndex((index) => index + 1);
      setProblemStartedAt(Date.now());
    }
  };

  if (!started) {
    const remaining = Math.max(0, countdownSeconds - Math.floor((Date.now() - countdownStartedAt) / 1000));
    return (
      <ScreenShell background={assetUrl('assets/texture/assets/result_background.png')} fit="cover">
        <section className="countdown-screen">
          <p>{song.experienceSet?.title ?? song.title}</p>
          <strong>{remaining > 0 ? remaining : 'START!'}</strong>
          <button className="small-button" onClick={onCancel}>{t('backToTitle')}</button>
        </section>
      </ScreenShell>
    );
  }

  if (problemCount === 0) {
    return (
      <ScreenShell background={assetUrl('assets/texture/assets/game_background2.gif')} fit="cover" dim>
        <section className="game-panel">
          <h1>{t('noQuestions')}</h1>
          <p>{t('noQuestionsHelp')}</p>
          <AssetButton imageSrc={assetUrl('assets/texture/assets/button/title.png')} label={t('backToTitle')} onClick={onCancel} />
        </section>
      </ScreenShell>
    );
  }

  const isCardOnomatopoeiaProblem = song.mode === 'onomatopoeiaQuiz' && Boolean(currentOnomatopoeia?.questionText);
  const topic = song.mode === 'onomatopoeiaQuiz'
    ? `${currentOnomatopoeia?.word ?? ''}のオノマトペは？`
    : currentProblem?.questionText ?? '';

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/game_background2.gif')} fit="cover">
      <div className="sound-toggle-slot" inert={feedback?.active}><SoundToggle /></div>
      <section className="game-hud" inert={feedback?.active}>
        <span>{song.experienceSet ? `${song.experienceSet.title} · ` : ''}{Math.min(currentIndex + 1, problemCount)} / {problemCount}</span>
        <strong className={remainingSeconds <= 3 ? 'danger-time' : ''}>{remainingSeconds}</strong>
        <button className="small-button" onClick={onCancel} disabled={feedback?.active}>{t('backToTitle')}</button>
      </section>
      <section className="game-card" ref={gameCardRef} inert={feedback?.active} onKeyDownCapture={preventRepeatedActivation}>
        {isCardOnomatopoeiaProblem && currentOnomatopoeia?.questionText ? (
          <section className="game-question-card">
            <p className="game-question-prompt">{makeQuestionDisplayText(currentIndex, t('fillBlank'))}</p>
            <p className="game-question-example">{currentOnomatopoeia.questionText}</p>
          </section>
        ) : (
          <h1>{makeQuestionDisplayText(currentIndex, topic)}</h1>
        )}

        {song.mode === 'freeText' ? (
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitFreeText();
            }}
          >
            <input value={input} onChange={(event) => setInput(event.target.value)} autoFocus placeholder={t('answerPlaceholder')} />
            <button type="submit">{t('submit')}</button>
          </form>
        ) : null}

        {song.mode === 'verbQuiz' ? (
          <div className="choice-grid">
            {(verbOptions?.options ?? []).map((entry, index) => (
              <button data-sfx="off" key={`${entry.word}-${entry.reading}-${index}`} onClick={() => submitVerb(entry, index)}>
                <small>{entry.reading}</small>
                <span>{index + 1} {entry.word}</span>
              </button>
            ))}
          </div>
        ) : null}

        {song.mode === 'onomatopoeiaQuiz' ? (
          <div className="choice-grid">
            {(onomatopoeiaOptions?.options ?? []).map((answer, index) => (
              <button data-sfx="off" key={`${answer}-${index}`} disabled={answerLocked} onClick={() => submitOnomatopoeia(answer)}>
                <span>{index + 1} {answer}</span>
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      {feedback?.active ? (
        <section
          className="feedback-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={feedbackTitleId}
          onKeyDownCapture={preventRepeatedActivation}
          onKeyDown={(event) => {
            if (event.key === 'Tab') {
              event.preventDefault();
              nextButtonRef.current?.focus();
            }
          }}
        >
          <div className="feedback-panel">
            <div className="judge-mark">{feedback.correct ? '○' : '×'}</div>
            <h2 id={feedbackTitleId}>{feedback.timeUp ? t('timeUp') : feedback.correct ? t('correct') : t('incorrect')}</h2>
            <p><span className="feedback-label">{t('prompt')}:</span> {feedback.question}</p>
            <p><span className="feedback-label">{t('yourAnswer')}:</span> {feedback.selected}</p>
            <p><span className="feedback-label">{t('correctAnswer')}:</span> {feedback.correctAnswer}</p>
            <small>{feedback.explanation}</small>
            <button ref={nextButtonRef} onClick={advanceFeedback}>{t('next')}</button>
          </div>
        </section>
      ) : null}
    </ScreenShell>
  );
}
