import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = resolve(webRoot, 'assets');
const destinationRoot = resolve(webRoot, 'dist/client/assets');
const publicAssets = [
  'texture',
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
const managedAssetRoots = ['texture', 'dict', 'score', 'inst'];

for (const directoryName of managedAssetRoots) {
  await rm(resolve(destinationRoot, directoryName), { recursive: true, force: true });
}
for (const relativePath of publicAssets) {
  const source = resolve(assetsRoot, relativePath);
  const destination = resolve(destinationRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}
