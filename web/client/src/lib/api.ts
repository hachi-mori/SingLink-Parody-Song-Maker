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

function isGitHubPagesHost(): boolean {
  return window.location.hostname.endsWith('.github.io');
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

export async function checkVoicevox(baseUrl: string, datasetId: DatasetId): Promise<VoicevoxVersionResponse> {
  assertKnownDataset(datasetId);
  try {
    if (datasetId === 'browserImport' || isGitHubPagesHost()) {
      const version = await checkDirectVoicevox(baseUrl, datasetId);
      return {
        ok: true,
        version,
        baseUrl,
        message: `VOICEVOX: OK (${version})`
      };
    }
    const response = await fetch(apiUrl(`/api/voicevox/version?baseUrl=${encodeURIComponent(baseUrl)}`));
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    return (await response.json()) as VoicevoxVersionResponse;
  } catch {
    return {
      ok: false,
      baseUrl,
      message: 'VOICEVOX未接続: クイズは遊べます。歌声生成にはローカル版の起動が必要です。'
    };
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
  if (datasetId === 'browserImport' || isGitHubPagesHost()) {
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
