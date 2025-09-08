import { create } from 'zustand';
import { DocumentItem, Collection } from '@/lib/types';
import { listCollections } from '@/api/collections';
import { listAllDocuments } from '@/api/documentsAll';
import { saveDocumentToCollection as apiSaveDocumentToCollection } from '@/api/documentsSave';
import { deleteCollection as apiDeleteCollection } from '@/api/collections';
import { createCollection as apiCreateCollection } from '@/api/collections';
import { Locale } from '@/i18n/messages';

interface DataState {
  collections: Collection[];
  documents: DocumentItem[];
  loadingCollections: boolean;
  loadingDocuments: boolean;
  errorCollections: string | null;
  errorDocuments: string | null;
  fetchCollections: (token: string, lang: Locale) => Promise<void>;
  fetchDocuments: (token: string, lang: Locale) => Promise<void>;
  saveDocumentToCollection: (documentId: number, collectionId: number, token: string, lang: Locale) => Promise<void>;
  deleteCollection: (collectionId: number, token: string, lang: Locale) => Promise<void>;
  createCollection: (name: string, token: string, lang: Locale) => Promise<Collection>;
}

export const useDataStore = create<DataState>((set, get) => ({
  collections: [],
  documents: [],
  loadingCollections: false,
  loadingDocuments: false,
  errorCollections: null,
  errorDocuments: null,

  fetchCollections: async (token, lang) => {
    if (get().loadingCollections) return;
    set({ loadingCollections: true, errorCollections: null });
    try {
      const data = await listCollections(token, lang);
      set({ collections: Array.isArray(data) ? data : [], loadingCollections: false });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to load collections';
      set({ errorCollections: error, loadingCollections: false, collections: [] });
      throw new Error(error);
    }
  },

  fetchDocuments: async (token, lang) => {
    if (get().loadingDocuments) return;
    set({ loadingDocuments: true, errorDocuments: null });
    try {
      const res = await listAllDocuments({ token, lang });
      const safeItems = Array.isArray(res.items) ? res.items : [];
      set({ documents: safeItems, loadingDocuments: false });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to load documents';
      set({ errorDocuments: error, loadingDocuments: false, documents: [] });
      throw new Error(error);
    }
  },

  saveDocumentToCollection: async (documentId, collectionId, token, lang) => {
    await apiSaveDocumentToCollection(documentId, collectionId, token, lang);
    // Refetch documents to get the updated list
    await get().fetchDocuments(token, lang);
  },

  deleteCollection: async (collectionId, token, lang) => {
    await apiDeleteCollection(collectionId, token, lang);
    // Refetch both collections and documents as a doc might have been disassociated
    await Promise.all([
      get().fetchCollections(token, lang),
      get().fetchDocuments(token, lang)
    ]);
  },

  createCollection: async (name, token, lang) => {
    const newCollection = await apiCreateCollection(name, token, lang);
    // Add to the start of the list
    set(state => ({ collections: [newCollection, ...state.collections] }));
    return newCollection;
  },
}));
