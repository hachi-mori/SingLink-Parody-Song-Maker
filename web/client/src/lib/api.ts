import type {
  SongDetail,
  SongInfo,
  SynthesisErrorResponse,
  SynthesisRequest,
  VoicevoxVersionResponse
} from '@shared/types';

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<SynthesisErrorResponse>;
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchSongs(): Promise<SongInfo[]> {
  const response = await fetch('/api/songs');
  if (!response.ok) {
    throw new Error(`曲一覧を読み込めませんでした: ${await readError(response)}`);
  }
  return (await response.json()) as SongInfo[];
}

export async function fetchSongDetail(songId: string): Promise<SongDetail> {
  const response = await fetch(`/api/songs/${encodeURIComponent(songId)}`);
  if (!response.ok) {
    throw new Error(`曲データを読み込めませんでした: ${await readError(response)}`);
  }
  return (await response.json()) as SongDetail;
}

export async function checkVoicevox(baseUrl: string): Promise<VoicevoxVersionResponse> {
  const response = await fetch(`/api/voicevox/version?baseUrl=${encodeURIComponent(baseUrl)}`);
  return (await response.json()) as VoicevoxVersionResponse;
}

export async function previewLyrics(songId: string, solvedTasks: SynthesisRequest['solvedTasks']): Promise<string> {
  const response = await fetch('/api/parody/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, solvedTasks })
  });
  if (!response.ok) {
    throw new Error(`歌詞プレビューを生成できませんでした: ${await readError(response)}`);
  }
  const body = (await response.json()) as { lyrics: string };
  return body.lyrics;
}

export async function synthesizeSong(request: SynthesisRequest): Promise<Blob> {
  const response = await fetch('/api/synthesis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.blob();
}
