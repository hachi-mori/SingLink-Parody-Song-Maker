import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cards = JSON.parse(fs.readFileSync(path.join(webRoot, 'assets/dict/cards_text_data.json'), 'utf8').replace(/^\uFEFF/, ''));
const english = JSON.parse(fs.readFileSync(path.join(webRoot, 'assets/dict/cards_english_data.json'), 'utf8').replace(/^\uFEFF/, ''));
const sourceByWord = new Map(cards.records.map((record) => [record.onomatopoeia, record.usages?.[0]?.text ?? '']));
const seen = new Set();
const problems = [];

for (const record of english.records) {
  if (seen.has(record.onomatopoeia)) problems.push(`${record.onomatopoeia}: duplicate`);
  seen.add(record.onomatopoeia);
  if (!record.meaning?.trim()) problems.push(`${record.onomatopoeia}: missing meaning`);
  if (!record.exampleEnglish?.trim()) problems.push(`${record.onomatopoeia}: missing exampleEnglish`);
  if (sourceByWord.get(record.onomatopoeia) !== record.exampleJapanese) problems.push(`${record.onomatopoeia}: Japanese example mismatch`);
}
for (const word of sourceByWord.keys()) {
  if (!seen.has(word)) problems.push(`${word}: missing translation`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  const reviewRecords = english.records.filter((record) => record.reviewStatus === 'needsReview');
  console.log(`English subtitles: ${english.records.length}/${sourceByWord.size}`);
  console.log(`Human review candidates: ${reviewRecords.length}`);
  const rows = process.argv.includes('--all') ? english.records : reviewRecords;
  console.log('| # | Japanese | Meaning | Example | Review note |');
  console.log('| -: | --- | --- | --- | --- |');
  for (const record of rows) {
    const index = cards.records.findIndex((item) => item.onomatopoeia === record.onomatopoeia) + 1;
    console.log(`| ${index} | ${record.onomatopoeia} | ${record.meaning} | ${record.exampleEnglish} | ${record.reviewNote ?? ''} |`);
  }
}
