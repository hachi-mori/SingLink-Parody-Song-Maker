import { cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(webRoot, 'assets');
const destination = resolve(webRoot, 'dist/client/assets');

await cp(source, destination, { recursive: true, force: true });
