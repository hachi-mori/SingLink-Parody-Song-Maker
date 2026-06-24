import { useEffect, useMemo, useState } from 'react';
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
import type { OnomatopoeiaEntry, SolvedTask, SongDetail, VerbEntry } from '@shared/types';
import { AssetButton } from '../components/AssetButton';
import { ScreenShell } from '../components/ScreenShell';
import { previewLyrics } from '../lib/api';
import { assetUrl } from '../lib/assets';
import { shuffle, takeShuffled } from '../lib/random';

type WriteLyricsScreenProps = {
  song: SongDetail;
  onComplete: (tasks: SolvedTask[], fullLyrics: string, inputTexts: string[]) => void;
  onCancel: () => void;
};

const timeLimit = 60;
const countdownSeconds = 3;
const onomatopoeiaTimeoutAnswer = 'ら'.repeat(6);

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

function prepareOnomatopoeiaOptions(entries: OnomatopoeiaEntry[], correctAnswer: string): { options: string[]; correctIndex: number } | undefined {
  const wrongAnswers = [...new Set(entries.map((entry) => entry.answer).filter((answer) => answer !== correctAnswer))];
  if (wrongAnswers.length < 2) {
    return undefined;
  }
  const options = shuffle([correctAnswer, ...takeShuffled(wrongAnswers, 2)]);
  return {
    options,
    correctIndex: options.indexOf(correctAnswer)
  };
}

export function WriteLyricsScreen({ song, onComplete, onCancel }: WriteLyricsScreenProps) {
  const [countdownStartedAt] = useState(() => Date.now());
  const [started, setStarted] = useState(false);
  const [problemStartedAt, setProblemStartedAt] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<SolvedTask[]>([]);
  const [inputTexts, setInputTexts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{
    active: boolean;
    correct: boolean;
    timeUp: boolean;
    question: string;
    selected: string;
    correctAnswer: string;
    explanation: string;
    answerForRecord: string;
  }>();

  const onomatopoeiaProblems = useMemo(() => {
    return song.mode === 'onomatopoeiaQuiz' ? takeShuffled(song.onomatopoeiaEntries ?? [], 3) : [];
  }, [song]);

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
    return prepareOnomatopoeiaOptions(song.onomatopoeiaEntries ?? [], currentOnomatopoeia.answer);
  }, [song, currentOnomatopoeia]);

  useTick(true);

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

  const elapsedSeconds = started ? Math.floor((Date.now() - problemStartedAt) / 1000) : 0;
  const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);

  const finish = async (nextTasks: SolvedTask[], nextInputTexts: string[]) => {
    if (song.mode === 'onomatopoeiaQuiz') {
      const answers = nextTasks
        .filter((task) => task.restPadding && task.syllables[0] === 'ル')
        .map((task) => task.userInput);
      onComplete(nextTasks, buildOnomatopoeiaResultLyrics(onomatopoeiaProblems, answers), nextInputTexts);
      return;
    }

    try {
      const lyrics = await previewLyrics(song.id, nextTasks);
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

  useEffect(() => {
    if (!started || feedback?.active || problemCount === 0 || remainingSeconds > 0) {
      return;
    }
    if (song.mode === 'onomatopoeiaQuiz' && currentOnomatopoeia) {
      setFeedback({
        active: true,
        correct: false,
        timeUp: true,
        question: currentOnomatopoeia.questionText ?? currentOnomatopoeia.word,
        selected: 'みかいとう',
        correctAnswer: currentOnomatopoeia.answer,
        explanation: currentOnomatopoeia.explanation || `「${currentOnomatopoeia.word}」には「${currentOnomatopoeia.answer}」がぴったりだよ。`,
        answerForRecord: onomatopoeiaTimeoutAnswer
      });
      return;
    }
    if (currentProblem) {
      advance(makeTimedOutTask(currentProblem), 'タイムアップ');
    }
  }, [started, feedback, remainingSeconds, problemCount, song.mode, currentOnomatopoeia, currentProblem]);

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
      return;
    }
    const result = buildVerbSolvedTask(currentProblem, entry);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    advance(result.task, entry.word);
  };

  const submitOnomatopoeia = (answer: string) => {
    if (!currentOnomatopoeia) {
      return;
    }
    const correct = answer === currentOnomatopoeia.answer;
    setFeedback({
      active: true,
      correct,
      timeUp: false,
      question: currentOnomatopoeia.questionText ?? currentOnomatopoeia.word,
      selected: answer,
      correctAnswer: currentOnomatopoeia.answer,
      explanation: currentOnomatopoeia.explanation || `「${currentOnomatopoeia.word}」には「${currentOnomatopoeia.answer}」がぴったりだよ。`,
      answerForRecord: answer
    });
  };

  const advanceFeedback = () => {
    if (!feedback || !currentOnomatopoeia) {
      return;
    }
    const generatedTasks = buildOnomatopoeiaTasks(currentOnomatopoeia, feedback.answerForRecord, feedback.correct);
    const nextTasks = [...tasks, ...generatedTasks];
    const nextInputTexts = [...inputTexts, currentOnomatopoeia.word, feedback.answerForRecord];
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
          <p>{song.title}</p>
          <strong>{remaining > 0 ? remaining : 'START!'}</strong>
        </section>
      </ScreenShell>
    );
  }

  if (problemCount === 0) {
    return (
      <ScreenShell background={assetUrl('assets/texture/assets/game_background2.gif')} fit="cover" dim>
        <section className="game-panel">
          <h1>お題がありません</h1>
          <p>曲データか辞書CSVを確認してください。</p>
          <AssetButton imageSrc={assetUrl('assets/texture/assets/button/title.png')} label="タイトルへ" onClick={onCancel} />
        </section>
      </ScreenShell>
    );
  }

  const topic = song.mode === 'onomatopoeiaQuiz'
    ? currentOnomatopoeia?.questionText
      ? `○○に入るオノマトペは？\n${currentOnomatopoeia.questionText}`
      : `${currentOnomatopoeia?.word ?? ''}のオノマトペは？`
    : currentProblem?.questionText ?? '';

  return (
    <ScreenShell background={assetUrl('assets/texture/assets/game_background2.gif')} fit="cover">
      <section className="game-hud">
        <span>{Math.min(currentIndex + 1, problemCount)} / {problemCount}</span>
        <strong className={remainingSeconds <= 3 ? 'danger-time' : ''}>{remainingSeconds}</strong>
      </section>
      <section className="game-card">
        <h1>{makeQuestionDisplayText(currentIndex, topic)}</h1>

        {song.mode === 'freeText' ? (
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitFreeText();
            }}
          >
            <input value={input} onChange={(event) => setInput(event.target.value)} autoFocus placeholder="ひらがなで入力" />
            <button type="submit">決定</button>
          </form>
        ) : null}

        {song.mode === 'verbQuiz' ? (
          <div className="choice-grid">
            {(verbOptions?.options ?? []).map((entry, index) => (
              <button key={`${entry.word}-${entry.reading}-${index}`} onClick={() => submitVerb(entry, index)}>
                <small>{entry.reading}</small>
                <span>{index + 1} {entry.word}</span>
              </button>
            ))}
          </div>
        ) : null}

        {song.mode === 'onomatopoeiaQuiz' ? (
          <div className="choice-grid">
            {(onomatopoeiaOptions?.options ?? []).map((answer, index) => (
              <button key={`${answer}-${index}`} onClick={() => submitOnomatopoeia(answer)}>
                <span>{index + 1} {answer}</span>
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      {feedback?.active ? (
        <section className="feedback-overlay" onClick={advanceFeedback}>
          <div className="feedback-panel">
            <div className="judge-mark">{feedback.correct ? '○' : '×'}</div>
            <h2>{feedback.timeUp ? 'タイムアップ！' : feedback.correct ? 'せいかい！' : 'ふせいかい'}</h2>
            <p>おだい: {feedback.question}</p>
            <p>あなたのこたえ: {feedback.selected}</p>
            <p>せいかい: {feedback.correctAnswer}</p>
            <small>{feedback.explanation}</small>
            <button>つぎへ</button>
          </div>
        </section>
      ) : null}
    </ScreenShell>
  );
}
