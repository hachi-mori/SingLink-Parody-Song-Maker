import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = resolve(webRoot, 'assets');
const distributionRoot = resolve(webRoot, 'dist/client/assets');

const expectedPublicAssets = [
  'texture',
  'demo',
  'sfx/click_004.ogg',
  'sfx/confirmation_003.ogg',
  'sfx/error_001.ogg',
  'sfx/License.txt',
  'sfx/SOURCES.md',
  'dict/cards_text_data.json',
  'dict/cards_singing_readings.json',
  'dict/cards_english_data.json',
  'score/オノマトペ.vvproj',
  'score/ちょうちょ.json',
  'score/むすんでひらいて.json',
  'score/大きな古時計.json',
  'score/幸せなら手をたたこう.json',
  'score/雪.json',
  'inst/ちょうちょ.wav',
  'inst/むすんでひらいて.wav',
  'inst/大きな古時計.wav',
  'inst/幸せなら手をたたこう.wav',
  'inst/雪.wav'
];
const expectedDemoFiles = [
  'demo/NOTICE.md',
  'demo/manifest.json',
  'demo/zundamon-shiawase-demo.wav'
];
const requiredDictionaryFiles = [
  'dict/cards_text_data.json',
  'dict/cards_singing_readings.json',
  'dict/cards_english_data.json'
];
const managedAssetRoots = ['texture', 'demo', 'sfx', 'dict', 'score', 'inst'];
const forbiddenPathFragments = ['local-only', 'legacy-web-assets', 'book'];
// Reviewed original curriculum. JSON canonicalization ignores checkout line endings.
// Any curriculum change requires explicitly reviewing and updating these fingerprints.
const approvedDictionaryHashes = {
  'dict/cards_text_data.json': 'b2cdb1c155a5e37f2fae2b5e32a240c858985400c3a02ae2a9905690650b99fc',
  'dict/cards_singing_readings.json': 'f5015e717c6e5c775aee53ec19f142bcda0b3368f462f1dffd3a0290db94dbc2',
  'dict/cards_english_data.json': 'aaf3d33909c692910d48304b698163a1bdadede9bc9e29c48639cad6193f4bc3'
};

function fail(message) {
  throw new Error(`公開アセット監査に失敗しました: ${message}`);
}

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/');
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(root, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    if (entry.isFile()) return [entryPath];
    return [];
  }));
  return files.flat();
}

function assertSamePaths(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((filePath) => !actualSet.has(filePath));
  const unexpected = actual.filter((filePath) => !expectedSet.has(filePath));
  if (missing.length > 0 || unexpected.length > 0) {
    fail(`${label} が許可リストと一致しません (不足 ${missing.length}件、想定外 ${unexpected.length}件)。`);
  }
}

async function parseCopyAssetAllowlist() {
  const source = await readFile(resolve(webRoot, 'scripts/copy-assets.mjs'), 'utf8');
  const match = source.match(/const publicAssets = \[([\s\S]*?)\];/);
  if (!match) fail('copy-assets.mjs の publicAssets を読み取れません。');
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

async function expectedDistributionFiles() {
  const result = [];
  for (const assetPath of expectedPublicAssets) {
    const sourcePath = resolve(assetsRoot, assetPath);
    const sourceInfo = await stat(sourcePath);
    if (sourceInfo.isFile()) {
      result.push(assetPath);
      continue;
    }
    if (!sourceInfo.isDirectory()) fail(`許可アセットがファイルでもディレクトリでもありません: ${assetPath}`);
    const nestedFiles = await listFiles(sourcePath);
    result.push(...nestedFiles.map((filePath) => normalizePath(relative(assetsRoot, filePath))));
  }
  return result.sort();
}

async function assertCopiedFilesMatchSource(files) {
  await Promise.all(files.map(async (filePath) => {
    const [source, distributed] = await Promise.all([
      readFile(resolve(assetsRoot, filePath)),
      readFile(resolve(distributionRoot, filePath))
    ]);
    if (!source.equals(distributed)) fail(`コピー元と成果物の内容が一致しません: ${filePath}`);
  }));
}

function recordsOf(value, label) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.records)) {
    fail(`${label} の records が配列ではありません。`);
  }
  return value.records;
}

async function readJson(relativePath) {
  const text = await readFile(resolve(distributionRoot, relativePath), 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

const copiedAllowlist = await parseCopyAssetAllowlist();
assertSamePaths(copiedAllowlist, expectedPublicAssets, 'copy-assets.mjs の publicAssets');
const topLevelDistribution = await readdir(resolve(webRoot, 'dist/client'));
assertSamePaths(topLevelDistribution, ['index.html', 'assets'], 'dist/client 直下');

const actualDistributionFiles = (await listFiles(distributionRoot))
  .map((filePath) => normalizePath(relative(distributionRoot, filePath)))
  .sort();
const expectedFiles = await expectedDistributionFiles();
const bundledFonts = actualDistributionFiles.filter((filePath) => /^Futehodo-MaruGothic-[A-Za-z0-9_-]+\.ttf$/.test(filePath));
for (const filePath of bundledFonts) {
  const source = await readFile(resolve(assetsRoot, 'texture/Futehodo-MaruGothic.ttf'));
  const bundled = await readFile(resolve(distributionRoot, filePath));
  if (!source.equals(bundled)) fail('バンドルされたフォントの内容が一致しません。');
}
const unexpectedFiles = actualDistributionFiles.filter((filePath) =>
  !expectedFiles.includes(filePath) && !bundledFonts.includes(filePath) && !/^index-[A-Za-z0-9_-]+\.(js|css)$/.test(filePath)
);
if (unexpectedFiles.length) fail(`許可されていない公開ファイルがあります (${unexpectedFiles.length}件)。`);
const copiedDistributionFiles = actualDistributionFiles.filter((filePath) => {
  const root = filePath.split('/', 1)[0];
  return managedAssetRoots.includes(root);
});
assertSamePaths(copiedDistributionFiles, expectedFiles, 'dist/client/assets のコピー対象');
await assertCopiedFilesMatchSource(expectedFiles);

const dictionaryFiles = copiedDistributionFiles.filter((filePath) => filePath.startsWith('dict/'));
assertSamePaths(dictionaryFiles, requiredDictionaryFiles, '公開辞書');
const demoFiles = copiedDistributionFiles.filter((filePath) => filePath.startsWith('demo/'));
assertSamePaths(demoFiles, expectedDemoFiles, '固定デモ');

const scoreJsonFiles = copiedDistributionFiles.filter((filePath) => filePath.startsWith('score/') && filePath.endsWith('.json'));
const instWavFiles = copiedDistributionFiles.filter((filePath) => filePath.startsWith('inst/') && filePath.endsWith('.wav'));
if (scoreJsonFiles.length !== 5 || instWavFiles.length !== 5) {
  fail(`5曲のscore/instが揃っていません (score JSON ${scoreJsonFiles.length}件、inst WAV ${instWavFiles.length}件)。`);
}

const forbiddenFiles = actualDistributionFiles.filter((filePath) => {
  const lowerCasePath = filePath.toLowerCase();
  return forbiddenPathFragments.some((fragment) => lowerCasePath.includes(fragment));
});
if (forbiddenFiles.length > 0) {
  fail(`禁止パスを含む公開ファイルがあります (${forbiddenFiles.length}件)。`);
}

const [cards, readings, english] = await Promise.all([
  readJson('dict/cards_text_data.json'),
  readJson('dict/cards_singing_readings.json'),
  readJson('dict/cards_english_data.json')
]);
for (const [filePath, expectedHash] of Object.entries(approvedDictionaryHashes)) {
  const value = await readJson(filePath);
  const actualHash = createHash('sha256').update(JSON.stringify(value)).digest('hex');
  if (actualHash !== expectedHash) fail(`承認済み自作教材と内容が一致しません: ${filePath}`);
}
const cardRecords = recordsOf(cards, 'カードデータ');
const englishRecords = recordsOf(english, '英語データ');
const readingMap = readings?.readings;
if (cardRecords.length !== 335 || englishRecords.length !== 335 || !readingMap || typeof readingMap !== 'object' || Array.isArray(readingMap) || Object.keys(readingMap).length !== 335) {
  fail(`公開辞書の件数が一致しません (カード ${cardRecords.length}件、読み ${readingMap && typeof readingMap === 'object' ? Object.keys(readingMap).length : 0}件、英語 ${englishRecords.length}件)。`);
}

console.log(`公開アセット監査: カード ${cardRecords.length}件、読み ${Object.keys(readingMap).length}件、英語 ${englishRecords.length}件、score JSON ${scoreJsonFiles.length}件、inst WAV ${instWavFiles.length}件。`);
