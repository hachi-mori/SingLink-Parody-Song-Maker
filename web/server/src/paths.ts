import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export const webRoot = path.resolve(currentDir, '../..');
export const assetsDir = path.join(webRoot, 'assets');
export const textureDir = path.join(assetsDir, 'texture');
export const scoreDir = path.join(assetsDir, 'score');
export const instDir = path.join(assetsDir, 'inst');
export const dictDir = path.join(assetsDir, 'dict');
export const tmpDir = path.join(webRoot, 'tmp');

export function toAssetUrl(...segments: string[]): string {
  return `/assets/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}
