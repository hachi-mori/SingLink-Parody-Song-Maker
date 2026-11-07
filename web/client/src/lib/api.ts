import type {
  DatasetId,
  SongDetail,
  SongInfo,
  SynthesisErrorResponse,
  SynthesisRequest,
  VoicevoxVersionResponse
} from '@shared/types';
import { fetchStaticSongDetail, fetchStaticSongs, previewStaticLyrics } from './staticSongs';
import { checkDirectVoicevox, synthesizeDirectVoicevox } from './directVoicevox';
import { assertKnownDataset, assertPublicDataset } from './quizDatasets';
import { usesDirectVoicevox, voicevoxBaseUrlForDataset } from './localVoicevox';

export type VoicevoxCheckFailure = 'permissionDenied' | 'timeout' | 'httpError' | 'invalidResponse' | 'invalidUrl' | 'networkError';
export type VoicevoxCheckResult = VoicevoxVersionResponse & { failure?: VoicevoxCheckFailure; httpStatus?: number };

async function queryLoopbackPermission(): Promise<PermissionState | undefined> {
  try {
    // Some browsers have Permissions API but do not recognize this name yet.
    const permission = await globalThis.navigator?.permissions?.query({ name: 'loopback-network' as PermissionName });
    return permission?.state;
  } catch {
    return undefined;
  }
}

const directSynthesisMessage = 'ローカルVOICEVOXへ接続できませんでした。ブラウザのローカルネットワーク権限とVOICEVOXのCORS設定を確認してください。';
const synthesisTimeoutMessage = '歌声生成の応答がありませんでした。VOICEVOX未接続、またはブラウザからローカルVOICEVOXへ接続できない可能性があります。';

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function apiUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

function isNetworkOrStaticHostError(error: unknown): boolean {
  return error instanceof TypeError || error instanceof SyntaxError;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<SynthesisErrorResponse>;
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchSongs(): Promise<SongInfo[]> {
  try {
    const response = await fetch(apiUrl('/api/songs'));
    if (!response.ok) {
      return fetchStaticSongs();
    }
    return (await response.json()) as SongInfo[];
  } catch (error) {
    if (isNetworkOrStaticHostError(error)) {
      return fetchStaticSongs();
    }
    throw error;
  }
}

export async function fetchSongDetail(songId: string): Promise<SongDetail> {
  try {
    const response = await fetch(apiUrl(`/api/songs/${encodeURIComponent(songId)}`));
    if (!response.ok) {
      return fetchStaticSongDetail(songId);
    }
    return (await response.json()) as SongDetail;
  } catch (error) {
    if (isNetworkOrStaticHostError(error)) {
      return fetchStaticSongDetail(songId);
    }
    throw error;
  }
}

export async function checkVoicevox(baseUrl: string, datasetId: DatasetId): Promise<VoicevoxCheckResult> {
  assertKnownDataset(datasetId);
  const direct = usesDirectVoicevox(datasetId);
  const failed = (failure: VoicevoxCheckFailure, httpStatus?: number): VoicevoxCheckResult =>
    ({ ok: false, baseUrl, message: 'VOICEVOXを確認できませんでした。', failure, httpStatus });
  let loopback = false;
  if (direct) {
    try {
      const url = new URL(voicevoxBaseUrlForDataset(baseUrl, datasetId));
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return failed('invalidUrl');
      loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    } catch {
      return failed('invalidUrl');
    }
  }

  const permission = loopback ? await queryLoopbackPermission() : undefined;
  if (permission === 'denied') return failed('permissionDenied');

  const controller = new AbortController();
  // Leave time to answer the browser prompt on a first connection.
  const timeout = globalThis.setTimeout(() => controller.abort(), loopback && permission !== 'granted' ? 30_000 : 5_000);
  try {
    const response = direct
      ? await checkDirectVoicevox(baseUrl, datasetId, controller.signal)
      : await fetch(apiUrl(`/api/voicevox/version?baseUrl=${encodeURIComponent(baseUrl)}`), { signal: controller.signal });
    if (!response.ok) return failed('httpError', response.status);

    if (direct) {
      const version: unknown = await response.json();
      if (typeof version !== 'string' || !version.trim()) return failed('invalidResponse');
      return { ok: true, version, baseUrl, message: `VOICEVOX: OK (${version})` };
    }
    const result = (await response.json()) as VoicevoxVersionResponse | null;
    return typeof result?.ok === 'boolean' ? result : failed('invalidResponse');
  } catch (error) {
    if (loopback && await queryLoopbackPermission() === 'denied') return failed('permissionDenied');
    if (controller.signal.aborted) return failed('timeout');
    return failed(error instanceof SyntaxError ? 'invalidResponse' : 'networkError');
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function previewLyrics(songId: string, solvedTasks: SynthesisRequest['solvedTasks'], datasetId: DatasetId): Promise<string> {
  assertPublicDataset(datasetId);
  try {
    const response = await fetch(apiUrl('/api/parody/preview'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, solvedTasks, datasetId })
    });
    if (!response.ok) {
      return previewStaticLyrics(songId, solvedTasks);
    }
    const body = (await response.json()) as { lyrics: string };
    return body.lyrics;
  } catch (error) {
    if (isNetworkOrStaticHostError(error)) {
      return previewStaticLyrics(songId, solvedTasks);
    }
    throw error;
  }
}

export async function synthesizeSong(request: SynthesisRequest, song: SongDetail, datasetId: DatasetId): Promise<Blob> {
  assertKnownDataset(datasetId);
  if (request.datasetId !== undefined && request.datasetId !== datasetId) throw new Error('教材の種類が一致しません。');
  // Private material uses direct loopback synthesis on every hosting environment.
  // Errors propagate to the UI; there is no server or cloud fallback.
  if (usesDirectVoicevox(datasetId)) {
    try {
      return await synthesizeDirectVoicevox(song, request.solvedTasks, request.voicevoxBaseUrl ?? 'http://localhost:50021', datasetId);
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(synthesisTimeoutMessage);
      }
      if (isNetworkOrStaticHostError(error)) {
        throw new Error(directSynthesisMessage);
      }
      throw error;
    }
  }

  try {
    const response = await fetch(apiUrl('/api/synthesis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, datasetId }),
      signal: createTimeoutSignal(120_000)
    });
    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      if (response.status === 404 || contentType.includes('text/html')) {
        throw new Error(directSynthesisMessage);
      }
      throw new Error(await readError(response));
    }
    return response.blob();
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(synthesisTimeoutMessage);
    }
    if (isNetworkOrStaticHostError(error)) {
      throw new Error(directSynthesisMessage);
    }
    throw error;
  }
}
