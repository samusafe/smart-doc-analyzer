import { DocumentItem } from '@/lib/types';
import { Api } from '@/lib/apiClient';

export async function listAllDocuments(opts: { token?: string; limit?: number; offset?: number; lang?: string } = {}): Promise<{ items: DocumentItem[]; total: number; }> {
  const { payload } = await Api.listAllDocuments({ limit: opts.limit, offset: opts.offset }, { token: opts.token, lang: opts.lang });
  return { items: (payload.items || []) as DocumentItem[], total: payload.total || 0 };
}
