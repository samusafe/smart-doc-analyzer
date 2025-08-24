export const STORAGE_KEYS = {
  activeTab: 'analysis.activeTab.v1',
  onboarding: 'analysis.onboarded.v1',
  keywordsHighlight: 'analysis.keywordsHighlight.v1',
  notesPrefix: 'analysis.notes.v1::'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
