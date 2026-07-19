import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, '..');
const cardsPath = path.join(webDir, 'assets', 'dict', 'cards_text_data.json');
const outputPath = path.join(webDir, 'assets', 'dict', 'cards_singing_readings.json');
const voicevoxBaseUrl = (process.env.VOICEVOX_BASE_URL ?? 'http://127.0.0.1:50021').replace(/\/+$/, '');
const speakerId = Number(process.env.VOICEVOX_READING_SPEAKER_ID ?? '2');
function katakanaToHiragana(text) {
  return Array.from(text, (character) => {
    const code = character.codePointAt(0);
    return code >= 0x30a1 && code <= 0x30f6
      ? String.fromCodePoint(code - 0x60)
      : character;
  }).join('');
}

async function makeSingingReading(text) {
  const response = await fetch(
    `${voicevoxBaseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error(`VOICEVOXの読み生成に失敗しました: ${response.status} ${text}`);
  }
  const query = await response.json();
  const katakana = (query.accent_phrases ?? [])
    .flatMap((phrase) => (phrase.moras ?? []).map((mora) => mora.text ?? ''))
    .join('');
  const reading = katakanaToHiragana(katakana);
  if (!reading) {
    throw new Error(`歌唱用読みが空です: ${text}`);
  }
  return reading;
}

const cards = JSON.parse(await fs.readFile(cardsPath, 'utf8'));
if (!Array.isArray(cards.records)) {
  throw new Error('cards_text_data.json に records がありません');
}

const readings = {};
for (const record of cards.records) {
  const word = typeof record.onomatopoeia === 'string' ? record.onomatopoeia.trim() : '';
  const usage = Array.isArray(record.usages)
    ? record.usages.find((item) => typeof item?.text === 'string' && item.text.includes(word))?.text
    : undefined;
  if (!word || !usage) {
    throw new Error(`例文を取得できません: ${record.number ?? '番号不明'}`);
  }
  if (word in readings) {
    throw new Error(`オノマトペが重複しています: ${word}`);
  }
  readings[word] = await makeSingingReading(usage);
}

const output = {
  record_count: Object.keys(readings).length,
  generator: `VOICEVOX audio_query speaker=${speakerId}`,
  readings
};
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`${outputPath} に ${output.record_count} 件の読みを保存しました。`);
