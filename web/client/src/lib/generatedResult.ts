import type { KaraokeLineTiming } from '@shared/types';

export type GeneratedResult =
  | {
      status: 'generated';
      blob: Blob;
      blobUrl: string;
      fileName: string;
      karaokeTimings: KaraokeLineTiming[];
      source: 'live' | 'demo';
    }
  | {
      status: 'skipped';
      message: string;
    };

export function hasGeneratedAudio(result: GeneratedResult): result is Extract<GeneratedResult, { status: 'generated' }> {
  return result.status === 'generated';
}
