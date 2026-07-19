import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const voicevoxBaseUrl = (process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021').replace(/\/+$/, '');
const singingQuerySpeakerId = 6000;
const zundamonNormalSpeakerId = 3003;
const frameRate = 93.75;
const sampleRate = 44_100;

const demoLines = [
  {
    japanese: '朝日がきらきら光ります',
    reading: ['あ', 'さ', 'ひ', 'が', 'き', 'ら', 'き', 'ら', 'ひ', 'か', 'り', 'ま', 'す'],
    keyword: 'きらきら',
    englishExample: 'The morning sun sparkles brightly.',
    englishMeaning: 'きらきら: sparkling or glittering'
  },
  {
    japanese: '雨がしとしと降っています',
    reading: ['あ', 'め', 'が', 'し', 'と', 'し', 'と', 'ふ', 'っ', 'て', 'い', 'ま', 'す'],
    keyword: 'しとしと',
    englishExample: 'The rain is falling softly and steadily.',
    englishMeaning: 'しとしと: gently and continuously, as with light rain'
  },
  {
    japanese: '猫がすやすや眠っています',
    reading: ['ね', 'こ', 'が', 'す', 'や', 'す', 'や', 'ね', 'む', 'っ', 'て', 'い', 'ま', 'す'],
    keyword: 'すやすや',
    englishExample: 'The cat is sleeping peacefully.',
    englishMeaning: 'すやすや: sleeping peacefully and comfortably'
  },
  {
    japanese: '鐘がりんりん鳴っています',
    reading: ['か', 'ね', 'が', 'り', 'ん', 'り', 'ん', 'な', 'っ', 'て', 'い', 'ま', 'す'],
    keyword: 'りんりん',
    englishExample: 'The bell is ringing brightly.',
    englishMeaning: 'りんりん: a clear, repeated ringing sound'
  }
];

// This short C-major melody was written specifically for the SingLink demo.
const phraseMelodies = [
  [60, 62, 64, 67, 64, 62, 64, 67, 69, 67, 64, 62, 60],
  [64, 65, 67, 69, 67, 65, 64, 62, 64, 65, 67, 64, 62],
  [60, 64, 67, 69, 67, 64, 62, 65, 64, 62, 60, 62, 64, 60],
  [67, 69, 72, 71, 69, 67, 64, 67, 65, 64, 62, 60, 60]
];

const noteFrames = 24;
const openingRestFrames = 18;
const phraseRestFrames = 30;
const closingRestFrames = 24;

function buildScoreAndTimings() {
  const notes = [{ frame_length: openingRestFrames, key: null, lyric: '', notelen: 'R' }];
  const timings = [];
  let elapsedFrames = openingRestFrames;

  demoLines.forEach((line, lineIndex) => {
    const melody = phraseMelodies[lineIndex];
    if (!melody || melody.length !== line.reading.length) {
      throw new Error(`Demo melody length mismatch on line ${lineIndex + 1}`);
    }
    const startSeconds = elapsedFrames / frameRate;
    const noteTimings = line.reading.map((lyric, noteIndex) => {
      const noteStart = elapsedFrames;
      elapsedFrames += noteFrames;
      notes.push({
        frame_length: noteFrames,
        key: melody[noteIndex],
        lyric,
        notelen: 'Q'
      });
      return {
        lyric,
        startSeconds: noteStart / frameRate,
        endSeconds: elapsedFrames / frameRate,
        startProgress: noteIndex / line.reading.length,
        endProgress: (noteIndex + 1) / line.reading.length
      };
    });
    timings.push({ startSeconds, endSeconds: elapsedFrames / frameRate, noteTimings });
    const restFrames = lineIndex === demoLines.length - 1 ? closingRestFrames : phraseRestFrames;
    notes.push({ frame_length: restFrames, key: null, lyric: '', notelen: 'R' });
    elapsedFrames += restFrames;
  });

  return { score: { notes }, timings, totalFrames: elapsedFrames };
}

async function postJson(url, body, timeoutMs = 120_000) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }
  return response;
}

async function synthesizeVoice(score) {
  const queryResponse = await postJson(
    `${voicevoxBaseUrl}/sing_frame_audio_query?speaker=${singingQuerySpeakerId}`,
    score
  );
  const query = await queryResponse.json();
  const tunedQuery = {
    ...query,
    volumeScale: 1,
    outputSamplingRate: sampleRate,
    outputStereo: true
  };
  const wavResponse = await postJson(
    `${voicevoxBaseUrl}/frame_synthesis?speaker=${zundamonNormalSpeakerId}`,
    tunedQuery
  );
  return Buffer.from(await wavResponse.arrayBuffer());
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function writeAscii(buffer, offset, value) {
  buffer.write(value, offset, value.length, 'ascii');
}

function encodeStereoWav(left, right) {
  const dataSize = left.length * 4;
  const output = Buffer.alloc(44 + dataSize);
  writeAscii(output, 0, 'RIFF');
  output.writeUInt32LE(36 + dataSize, 4);
  writeAscii(output, 8, 'WAVE');
  writeAscii(output, 12, 'fmt ');
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(2, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * 4, 28);
  output.writeUInt16LE(4, 32);
  output.writeUInt16LE(16, 34);
  writeAscii(output, 36, 'data');
  output.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < left.length; index += 1) {
    output.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[index])) * 32767), 44 + index * 4);
    output.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[index])) * 32767), 46 + index * 4);
  }
  return output;
}

function addTone(channels, startSeconds, durationSeconds, midi, volume, pan = 0) {
  const start = Math.max(0, Math.floor(startSeconds * sampleRate));
  const end = Math.min(channels.left.length, Math.ceil((startSeconds + durationSeconds) * sampleRate));
  const frequency = midiToFrequency(midi);
  const leftGain = Math.sqrt((1 - pan) / 2);
  const rightGain = Math.sqrt((1 + pan) / 2);
  for (let sample = start; sample < end; sample += 1) {
    const localTime = (sample - start) / sampleRate;
    const fadeIn = Math.min(1, localTime / 0.018);
    const fadeOut = Math.min(1, (durationSeconds - localTime) / 0.06);
    const envelope = Math.max(0, Math.min(fadeIn, fadeOut)) * Math.exp(-localTime * 0.5);
    const phase = 2 * Math.PI * frequency * localTime;
    const value = (Math.sin(phase) + Math.sin(phase * 2) * 0.18) * volume * envelope;
    channels.left[sample] += value * leftGain;
    channels.right[sample] += value * rightGain;
  }
}

function synthesizeAccompaniment(score, totalFrames) {
  const durationSeconds = totalFrames / frameRate;
  const sampleCount = Math.ceil(durationSeconds * sampleRate);
  const channels = { left: new Float32Array(sampleCount), right: new Float32Array(sampleCount) };
  const chordRoots = [48, 53, 45, 55]; // C, F, Am, G
  let elapsedFrames = 0;
  let phraseIndex = -1;
  let melodicNoteIndex = 0;

  for (const note of score.notes) {
    const startSeconds = elapsedFrames / frameRate;
    const duration = note.frame_length / frameRate;
    if (note.key !== null) {
      if (melodicNoteIndex === 0) phraseIndex += 1;
      addTone(channels, startSeconds, duration * 0.92, note.key - 12, 0.09, -0.18);
      const root = chordRoots[Math.max(0, phraseIndex) % chordRoots.length];
      if (melodicNoteIndex % 4 === 0) {
        addTone(channels, startSeconds, Math.min(duration * 3.6, 0.95), root, 0.13, -0.35);
        addTone(channels, startSeconds, Math.min(duration * 3.6, 0.95), root + 7, 0.08, 0.35);
      }
      melodicNoteIndex += 1;
    } else if (elapsedFrames > openingRestFrames) {
      melodicNoteIndex = 0;
    }
    elapsedFrames += note.frame_length;
  }
  return encodeStereoWav(channels.left, channels.right);
}

async function main() {
  const outputDirectory = path.resolve('assets/demo');
  await mkdir(outputDirectory, { recursive: true });
  const { score, timings, totalFrames } = buildScoreAndTimings();
  const versionResponse = await fetch(`${voicevoxBaseUrl}/version`, { signal: AbortSignal.timeout(5_000) });
  if (!versionResponse.ok) throw new Error('VOICEVOX version check failed');
  const voicevoxVersion = await versionResponse.json();
  const [voiceWav, accompanimentWav] = await Promise.all([
    synthesizeVoice(score),
    Promise.resolve(synthesizeAccompaniment(score, totalFrames))
  ]);

  const manifest = {
    version: 1,
    id: 'singlink-original-demo-v1',
    title: {
      ja: 'シングリンク オリジナル・デモメロディ',
      en: 'SingLink Original Demo Melody'
    },
    disclosure: {
      ja: 'これは事前生成したデモサンプルです。通常モードでは、クイズの回答から歌声をリアルタイム生成します。',
      en: 'This is a pre-generated demo sample. In normal mode, the singing voice is generated in real time from your quiz answers.'
    },
    voice: {
      path: 'assets/demo/zundamon-voice.wav',
      credit: 'VOICEVOX:ずんだもん',
      engineVersion: String(voicevoxVersion),
      speakerId: zundamonNormalSpeakerId,
      style: 'ノーマル'
    },
    accompaniment: {
      path: 'assets/demo/original-accompaniment.wav',
      credit: 'Original melody, accompaniment, and example sentences created by the SingLink project author for this demo.'
    },
    lines: demoLines.map((line) => ({
      japanese: line.japanese,
      singingReading: line.reading.join(''),
      keyword: line.keyword,
      englishExample: line.englishExample,
      englishMeaning: line.englishMeaning
    })),
    karaokeTimings: timings
  };

  await Promise.all([
    writeFile(path.join(outputDirectory, 'zundamon-voice.wav'), voiceWav),
    writeFile(path.join(outputDirectory, 'original-accompaniment.wav'), accompanimentWav),
    writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  ]);
  console.log(`Generated demo assets in ${outputDirectory}`);
  console.log(`VOICEVOX ${voicevoxVersion}; duration ${(totalFrames / frameRate).toFixed(2)}s`);
}

await main();
