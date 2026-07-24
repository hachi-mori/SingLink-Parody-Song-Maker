import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildKaraokeLineTimings,
  createMemorizationScore,
  voicevoxFrameRate
} from '../shared/src/memorizationScore.ts';
import { getVoicevoxVersion, synthesizeSongScore } from '../server/src/voicevox.ts';

const voicevoxBaseUrl = (process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021').replace(/\/+$/, '');
const sourceSong = {
  id: 'shiawase-nara-tewo-tatakou',
  title: '幸せなら手をたたこう',
  scorePath: 'assets/score/幸せなら手をたたこう.json',
  accompanimentPath: 'assets/inst/幸せなら手をたたこう.wav'
};
const demoVoiceFileName = 'zundamon-shiawase-demo.wav';

const demoLines = [
  {
    japanese: '朝日がきらきら光ります',
    singingReading: 'あさひがきらきらひかります',
    keyword: 'きらきら',
    englishExample: 'The morning sun sparkles brightly.',
    englishMeaning: 'きらきら: sparkling or glittering'
  },
  {
    japanese: '雨がしとしと降っています',
    singingReading: 'あめがしとしとふっています',
    keyword: 'しとしと',
    englishExample: 'The rain is falling softly and steadily.',
    englishMeaning: 'しとしと: gently and continuously, as with light rain'
  },
  {
    japanese: '猫がすやすや眠っています',
    singingReading: 'ねこがすやすやねむっています',
    keyword: 'すやすや',
    englishExample: 'The cat is sleeping peacefully.',
    englishMeaning: 'すやすや: sleeping peacefully and comfortably'
  },
  {
    japanese: '鐘がりんりん鳴っています',
    singingReading: 'かねがりんりんなっています',
    keyword: 'りんりん',
    englishExample: 'The bell is ringing brightly.',
    englishMeaning: 'りんりん: a clear, repeated ringing sound'
  }
];

async function readJsonWithoutBom(filePath) {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
}

async function main() {
  const outputDirectory = path.resolve('assets/demo');
  const originalScore = await readJsonWithoutBom(path.resolve(sourceSong.scorePath));
  const lyricsRows = demoLines.map((line) => [line.japanese, line.singingReading]);
  const generated = createMemorizationScore(lyricsRows, originalScore);
  const solvedTasks = demoLines.map((line) => ({
    phrase: line.japanese,
    syllables: Array.from(line.singingReading),
    userInput: line.keyword,
    userSyllables: Array.from(line.keyword),
    isCorrect: true,
    singingReading: line.singingReading,
    englishExample: line.englishExample,
    englishMeaning: line.englishMeaning
  }));
  const karaokeTimings = buildKaraokeLineTimings(
    generated.score,
    generated.phraseRanges,
    voicevoxFrameRate,
    demoLines.map((line) => line.japanese)
  );
  const voicevoxVersion = await getVoicevoxVersion(voicevoxBaseUrl);
  const voiceWav = await synthesizeSongScore(
    generated.score,
    voicevoxBaseUrl,
    solvedTasks,
    'オノマトペ',
    generated.phraseRanges
  );

  const manifest = {
    version: 1,
    id: 'singlink-shiawase-demo-v1',
    title: {
      ja: sourceSong.title,
      en: "If You're Happy and You Know It"
    },
    disclosure: {
      ja: 'これは既存曲の楽譜と伴奏を使って事前生成したデモサンプルです。通常モードでは、クイズの回答から歌声をリアルタイム生成します。',
      en: 'This is a pre-generated demo sample using an existing in-project score and accompaniment. In normal mode, the singing voice is generated in real time from your quiz answers.'
    },
    sourceSong,
    voice: {
      path: `assets/demo/${demoVoiceFileName}`,
      credit: 'VOICEVOX:ずんだもん',
      engineVersion: voicevoxVersion,
      speakerId: 3003,
      style: 'ノーマル'
    },
    accompaniment: {
      path: sourceSong.accompanimentPath,
      credit: `${sourceSong.title}: project score and accompaniment asset`
    },
    lines: demoLines,
    karaokeTimings
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, demoVoiceFileName), voiceWav),
    writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  ]);
  const durationSeconds = generated.score.notes.reduce((sum, note) => sum + note.frame_length, 0) / voicevoxFrameRate;
  console.log(`Generated ${sourceSong.title} demo assets in ${outputDirectory}`);
  console.log(`VOICEVOX ${voicevoxVersion}; ${generated.phraseRanges.length} phrases; ${durationSeconds.toFixed(2)}s`);
}

await main();
