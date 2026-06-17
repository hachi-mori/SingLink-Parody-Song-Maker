import type {
  SongDetail,
  SongInfo,
  SynthesisErrorResponse,
  SynthesisRequest,
  VoicevoxVersionResponse
} from '@shared/types';
import { fetchStaticSongDetail, fetchStaticSongs, previewStaticLyrics } from './staticSongs';

const staticSynthesisMessage = 'この公開版では歌声生成サーバーに接続できません。クイズは遊べますが、歌声生成にはローカル版とVOICEVOXの起動が必要です。';

function apiUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

function isNetworkOrStaticHostError(error: unknown): boolean {
  return error instanceof TypeError || error instanceof SyntaxError;
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

export async function checkVoicevox(baseUrl: string): Promise<VoicevoxVersionResponse> {
  try {
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

export async function previewLyrics(songId: string, solvedTasks: SynthesisRequest['solvedTasks']): Promise<string> {
  try {
    const response = await fetch(apiUrl('/api/parody/preview'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, solvedTasks })
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

export async function synthesizeSong(request: SynthesisRequest): Promise<Blob> {
  try {
    const response = await fetch(apiUrl('/api/synthesis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      if (response.status === 404 || contentType.includes('text/html')) {
        throw new Error(staticSynthesisMessage);
      }
      throw new Error(await readError(response));
    }
    return response.blob();
  } catch (error) {
    if (isNetworkOrStaticHostError(error)) {
      throw new Error(staticSynthesisMessage);
    }
    throw error;
  }
}
