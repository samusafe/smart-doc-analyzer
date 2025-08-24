import { useState, useEffect } from 'react';

export function usePersistentTab(storageKey: string, defaultValue: string) {
  const [tab, setTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || defaultValue;
    }
    return defaultValue;
  });
  useEffect(() => { try { localStorage.setItem(storageKey, tab); } catch {} }, [storageKey, tab]);
  return [tab, setTab] as const;
}
