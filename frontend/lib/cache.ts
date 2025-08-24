import { Collection, DocumentItem } from '@/lib/types';
import { listCollections } from '@/api/collections';
import { listAllDocuments } from '@/api/documentsAll';

interface CacheEntry<T> { data: T | null; promise: Promise<T> | null; fetchedAt: number; }

const COLLECTIONS_TTL = 30_000; // hard TTL (serve stale beyond this? we refetch anyway)
const DOCUMENTS_TTL = 30_000;
const SOFT_TTL = 10_000; // after this, allow background revalidation
const REVALIDATE_INTERVAL = 60_000; // periodic background

// Storage keys
const STORAGE_KEYS = {
  collections: 'cache.collections.v1',
  documents: 'cache.documents.v1'
};

let collectionsCache: CacheEntry<Collection[]> = { data: null, promise: null, fetchedAt: 0 };
let documentsCache: CacheEntry<{ items: DocumentItem[]; total: number; }> = { data: null, promise: null, fetchedAt: 0 };

function isFresh<T>(entry: CacheEntry<T>, ttl: number) {
  return !!entry.data && (Date.now() - entry.fetchedAt) < ttl;
}

function isSoftStale<T>(entry: CacheEntry<T>) {
  return !!entry.data && (Date.now() - entry.fetchedAt) > SOFT_TTL;
}

function loadFromSession<T>(key: string): { data: T | null; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch { return null; }
}

function saveToSession<T>(key: string, value: { data: T; fetchedAt: number }) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function removeFromSession(key: string) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

// Hydrate caches from sessionStorage on module load (browser only)
(function hydrate() {
  if (typeof window === 'undefined') return;
  const col = loadFromSession<Collection[]>(STORAGE_KEYS.collections);
  if (col) collectionsCache = { data: col.data, promise: null, fetchedAt: col.fetchedAt };
  const docs = loadFromSession<{ items: DocumentItem[]; total: number }>(STORAGE_KEYS.documents);
  if (docs) documentsCache = { data: docs.data, promise: null, fetchedAt: docs.fetchedAt };
})();

async function fetchCollections(token?: string, lang?: string) {
  const data = await listCollections(token, lang);
  const fetchedAt = Date.now();
  collectionsCache = { data, promise: null, fetchedAt };
  saveToSession(STORAGE_KEYS.collections, { data, fetchedAt });
  return data;
}

async function fetchDocuments(token?: string, lang?: string) {
  const data = await listAllDocuments({ token, limit: 100, lang });
  const fetchedAt = Date.now();
  documentsCache = { data, promise: null, fetchedAt };
  saveToSession(STORAGE_KEYS.documents, { data, fetchedAt });
  return data;
}

export async function getCollectionsCached(token?: string, lang?: string, force = false, background = false): Promise<Collection[]> {
  if (!force && isFresh(collectionsCache, COLLECTIONS_TTL)) {
    if (!background && isSoftStale(collectionsCache)) revalidateCollections(token, lang); // trigger background
    return collectionsCache.data!;
  }
  if (!force && collectionsCache.promise) return collectionsCache.promise;
  const p = fetchCollections(token, lang).catch(err => { collectionsCache.promise = null; throw err; });
  collectionsCache.promise = p;
  return p;
}

export async function getDocumentsCached(token?: string, lang?: string, force = false, background = false): Promise<{ items: DocumentItem[]; total: number; }> {
  if (!force && isFresh(documentsCache, DOCUMENTS_TTL)) {
    if (!background && isSoftStale(documentsCache)) revalidateDocuments(token, lang);
    return documentsCache.data!;
  }
  if (!force && documentsCache.promise) return documentsCache.promise;
  const p = fetchDocuments(token, lang).catch(err => { documentsCache.promise = null; throw err; });
  documentsCache.promise = p;
  return p;
}

export function invalidateCollectionsCache() {
  collectionsCache = { data: null, promise: null, fetchedAt: 0 };
  removeFromSession(STORAGE_KEYS.collections);
}

export function invalidateDocumentsCache() {
  documentsCache = { data: null, promise: null, fetchedAt: 0 };
  removeFromSession(STORAGE_KEYS.documents);
}

let collectionsRevalidating = false;
let documentsRevalidating = false;
export function revalidateCollections(token?: string, lang?: string) {
  if (collectionsRevalidating) return;
  collectionsRevalidating = true;
  fetchCollections(token, lang).finally(() => { collectionsRevalidating = false; });
}
export function revalidateDocuments(token?: string, lang?: string) {
  if (documentsRevalidating) return;
  documentsRevalidating = true;
  fetchDocuments(token, lang).finally(() => { documentsRevalidating = false; });
}

// Focus / visibility revalidation
if (typeof window !== 'undefined') {
  const onFocus = () => {
    if (isSoftStale(collectionsCache)) revalidateCollections();
    if (isSoftStale(documentsCache)) revalidateDocuments();
  };
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') onFocus(); });
  window.addEventListener('focus', onFocus);
  // Interval
  setInterval(() => { onFocus(); }, REVALIDATE_INTERVAL);
}
