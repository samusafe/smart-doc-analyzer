import { buildAuthHeaders } from './utils';
import { REQUEST_ID_HEADER } from './constants/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Generates lightweight UUID (client trace only; not cryptographically secure)
function uuid(): string {
  // Simple UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// buildQuery turns a record into ?k=v skipping empty values.
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export interface ApiClientOptions {
  token?: string;
  lang?: string;
  requestId?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface ApiSuccess<T> { payload: T; correlationId: string; response: Response; }

export class ApiError extends Error {
  status: number;
  correlationId?: string;
  detail?: unknown;
  constructor(message: string, status: number, correlationId?: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
    this.detail = detail;
  }
}

interface EnvelopeShape {
  data?: unknown;
  message?: string;
  detail?: unknown;
  correlationId?: string;
  [k: string]: unknown;
}

// apiFetch unwraps backend envelope: success => data (if present) else raw body.
// On error throws ApiError carrying status, correlationId, detail.
// Correlation ID fallback: uses request id if header missing.
async function parseJSONSafe(res: Response): Promise<EnvelopeShape | null> {
  try { return await res.json() as EnvelopeShape; } catch { return null; }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit & ApiClientOptions = {}): Promise<ApiSuccess<T>> {
  const { token, lang, requestId, signal, headers, ...rest } = init as ApiClientOptions & RequestInit;
  const rid = requestId || uuid();
  const baseHeaders = buildAuthHeaders(token, lang) as Record<string,string>;
  const merged: Record<string,string> = { ...baseHeaders };
  if (headers) Object.assign(merged, headers);
  if (!merged[REQUEST_ID_HEADER]) merged[REQUEST_ID_HEADER] = rid;

  const res = await fetch(`${API_URL}${path}`, { ...(rest as RequestInit), headers: merged, signal });
  const cid = res.headers.get(REQUEST_ID_HEADER) || rid;
  const body = await parseJSONSafe(res);

  if (!res.ok) {
    const msg = body?.message || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body?.correlationId || cid, body?.detail);
  }
  const payload = (body && Object.prototype.hasOwnProperty.call(body, 'data')) ? body.data : body;
  return { payload: payload as T, correlationId: body?.correlationId || cid, response: res };
}

// Domain-specific helpers (typed minimal shapes)
export interface AnalyzeResults { results: unknown[] }
export interface CollectionsPayload { collections: unknown[] }
export interface CollectionCreated { collection: unknown; message: string }
export interface MessagePayload { message: string }
export interface ItemsPayload { items: unknown[]; total: number }
export interface AnalysisPayload { analysis: unknown }

// Endpoint map (backend REST):
// POST   /analyze (multipart)
// POST   /generate-quiz
// GET    /collections
// POST   /collections
// DELETE /collections/{id}
// GET    /collections/{id}/documents?limit&offset
// GET    /documents?limit&offset
// GET    /documents/{documentId}/latest-analysis
// POST   /documents/save
export const Api = {
  analyze: (form: FormData, opts: ApiClientOptions = {}) => apiFetch<AnalyzeResults>(`/analyze`, { method: 'POST', body: form as FormData, ...opts }),
  generateQuiz: (text: string, opts: ApiClientOptions = {}) => apiFetch<{ questions?: unknown[] }>(`/generate-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), ...opts }),
  listCollections: (opts: ApiClientOptions = {}) => apiFetch<CollectionsPayload>(`/collections`, { ...opts }),
  createCollection: (name: string, opts: ApiClientOptions = {}) => apiFetch<CollectionCreated>(`/collections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), ...opts }),
  deleteCollection: (id: number, opts: ApiClientOptions = {}) => apiFetch<MessagePayload>(`/collections/${id}`, { method: 'DELETE', ...opts }),
  listDocumentsInCollection: (collectionId: number, params: { limit?: number; offset?: number } = {}, opts: ApiClientOptions = {}) =>
    apiFetch<ItemsPayload>(`/collections/${collectionId}/documents${buildQuery(params)}`, { ...opts }),
  listAllDocuments: (params: { limit?: number; offset?: number } = {}, opts: ApiClientOptions = {}) =>
    apiFetch<ItemsPayload>(`/documents${buildQuery(params)}`, { ...opts }),
  latestAnalysis: (documentId: number, opts: ApiClientOptions = {}) => apiFetch<AnalysisPayload>(`/documents/${documentId}/latest-analysis`, { ...opts }),
  saveDocument: (documentId: number, collectionId: number, opts: ApiClientOptions = {}) => apiFetch<MessagePayload>(`/documents/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId, collectionId }), ...opts }),
};
