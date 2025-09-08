'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ReactNode, createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { getMessages, Locale, normalizeLocale, defaultLocale } from '@/i18n/messages';

interface TokenCtxValue { token?: string; setToken: (t?: string) => void }
const TokenContext = createContext<TokenCtxValue>({ setToken: () => {} });
export function useAuthToken() { return useContext(TokenContext).token; }
export function useSetAuthToken() { return useContext(TokenContext).setToken; }

interface LangCtxValue { lang: Locale; setLang: (l: Locale) => void; t: (key: string, vars?: Record<string,string|number>) => string }
const LangContext = createContext<LangCtxValue>({ lang: defaultLocale, setLang: () => {}, t: (k)=>k });
export function useAppLanguage() { return useContext(LangContext).lang; }
export function useSetAppLanguage() { return useContext(LangContext).setLang; }
export function useT() { return useContext(LangContext).t; }

const LANG_STORAGE_KEY = 'app.lang.v1';

function detectInitialLanguage(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored) return normalizeLocale(stored);
  } catch {/* ignore */}
  const navLang = navigator.language || navigator.languages?.[0] || defaultLocale;
  return normalizeLocale(navLang);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [lang, setLangRaw] = useState<Locale>(defaultLocale);

  // Hydrate language on mount
  useEffect(() => { setLangRaw(detectInitialLanguage()); }, []);

  // Listen for cross-tab language changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && e.newValue) {
        setLangRaw(normalizeLocale(e.newValue));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setLang = useCallback((val: Locale) => {
    const normalized = normalizeLocale(val);
    setLangRaw(normalized);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(LANG_STORAGE_KEY, normalized); } catch {/* ignore */}
    }
  }, []);

  // Preload messages for current lang and keep in state for synchronous access
  const [dict, setDict] = useState<Record<string,string>>({});
  useEffect(() => { (async () => { setDict(await getMessages(lang)); })(); }, [lang]);
  const t = useCallback((key: string, vars?: Record<string,string|number>) => {
    let str = dict[key] ?? key;
    if (vars) for (const [k,v] of Object.entries(vars)) str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    return str;
  }, [dict]);

  const tokenValue = useMemo(() => ({ token, setToken }), [token]);

  return (
    <ClerkProvider
      dynamic={true}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: '#6366f1' }
      }}
    >
      <TokenContext.Provider value={tokenValue}>
        <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
      </TokenContext.Provider>
    </ClerkProvider>
  );
}
