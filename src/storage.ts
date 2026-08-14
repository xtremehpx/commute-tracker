import type { CommuteEntry } from './models';

const DB_NAME = 'commute-tracker-db';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEntries(): Promise<CommuteEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as CommuteEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEntry(entry: CommuteEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function replaceAllEntries(entries: CommuteEntry[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      entries.forEach(entry => store.put(entry));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to replace entries'));
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to clear entries'));
  });
}

export function exportEntries(entries: CommuteEntry[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: 1,
    entries,
  }, null, 2);
}

export function importEntries(json: string): CommuteEntry[] {
  const parsed = JSON.parse(json) as { entries?: CommuteEntry[] };

  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error('The selected file is not a valid commute tracker export.');
  }

  return parsed.entries.map(entry => ({
    ...entry,
    id: entry.id || `${entry.date}-${entry.period}`,
    note: entry.note ?? '',
  }));
}