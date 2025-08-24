import { Api } from '@/lib/apiClient';

export async function saveDocumentToCollection(documentId: number, collectionId: number, token?: string, lang?: string): Promise<void> {
  await Api.saveDocument(documentId, collectionId, { token, lang });
}
