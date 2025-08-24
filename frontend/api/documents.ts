import { DocumentItem } from "@/lib/types";
import { Api } from "@/lib/apiClient";

export async function listDocumentsInCollection(collectionId: number, opts: { limit?: number; offset?: number; token?: string; lang?: string } = {}): Promise<{ items: DocumentItem[]; total: number; }> {
  const { payload } = await Api.listDocumentsInCollection(collectionId, { limit: opts.limit, offset: opts.offset }, { token: opts.token, lang: opts.lang });
  return { items: (payload.items || []) as DocumentItem[], total: payload.total || 0 };
}
