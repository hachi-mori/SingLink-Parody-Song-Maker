import { openDB, type DBSchema } from 'idb';
import type { DatasetId, GeneratedTrackRecord } from '@shared/types';
import { assertKnownDataset } from './quizDatasets';

type StoredGeneratedTrack = Omit<GeneratedTrackRecord, 'wavBlob'> & {
  wavBlob: Blob;
};

interface SingLinkDb extends DBSchema {
  tracks: {
    key: string;
    value: StoredGeneratedTrack;
    indexes: {
      'by-createdAt': string;
    };
  };
}

// History is device/browser-local and is never synchronized by the application.
let dbPromise: ReturnType<typeof openDB<SingLinkDb>> | undefined;
function getDb() {
  dbPromise ??= openDB<SingLinkDb>('singlink-web-history', 1, {
    upgrade(db) {
      const store = db.createObjectStore('tracks', { keyPath: 'id' });
      store.createIndex('by-createdAt', 'createdAt');
    }
  });
  return dbPromise;
}

export async function saveGeneratedTrack(record: GeneratedTrackRecord, datasetId: DatasetId): Promise<void> {
  assertKnownDataset(datasetId);
  if (record.datasetId !== undefined && record.datasetId !== datasetId) throw new Error('教材の種類が一致しません。');
  const db = await getDb();
  await db.put('tracks', { ...record, datasetId });
}

export async function listGeneratedTracks(): Promise<GeneratedTrackRecord[]> {
  const db = await getDb();
  const tracks = await db.getAllFromIndex('tracks', 'by-createdAt');
  return tracks.reverse();
}

export async function deleteGeneratedTrack(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('tracks', id);
}
