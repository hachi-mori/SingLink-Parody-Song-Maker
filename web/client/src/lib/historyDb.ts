import { openDB, type DBSchema } from 'idb';
import type { GeneratedTrackRecord } from '@shared/types';

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

const dbPromise = openDB<SingLinkDb>('singlink-web-history', 1, {
  upgrade(db) {
    const store = db.createObjectStore('tracks', { keyPath: 'id' });
    store.createIndex('by-createdAt', 'createdAt');
  }
});

export async function saveGeneratedTrack(record: GeneratedTrackRecord): Promise<void> {
  const db = await dbPromise;
  await db.put('tracks', record);
}

export async function listGeneratedTracks(): Promise<GeneratedTrackRecord[]> {
  const db = await dbPromise;
  const tracks = await db.getAllFromIndex('tracks', 'by-createdAt');
  return tracks.reverse();
}

export async function deleteGeneratedTrack(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete('tracks', id);
}
