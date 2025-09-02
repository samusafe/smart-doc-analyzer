"use client";

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import { Toaster } from '@/components/ui/Toaster';
import { useAppLanguage, useSetAppLanguage, useT } from '@/components/providers/AppProviders';

function TopBarActions() {
  const lang = useAppLanguage();
  const setLang = useSetAppLanguage();
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <select
        value={lang}
        onChange={(e)=> setLang(e.target.value === 'pt' ? 'pt' : 'en')}
        aria-label={t('selectLanguage')}
        className="text-sm bg-slate-800/60 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
      <AuthButton />
    </div>
  );
}

export function ClientRoot({ children }: { children: ReactNode }) {
  const lang = useAppLanguage();
  const t = useT();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-semibold hover:opacity-80 transition text-gradient"
          >
            {t('appTitle')}
          </Link>
          <TopBarActions />
        </div>
      </div>
      <div className="pt-14">
        {children}
        <footer className="mt-16 border-t border-slate-800/60 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-300">{t('appTitle')}</span>
              <span className="hidden md:inline">·</span>
              <span>{t('footerOpenSource')} <a href="https://github.com/samusafe/smart-doc-analyzer" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline decoration-dotted">GitHub</a></span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://github.com/samusafe/smart-doc-analyzer" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition border border-slate-700/70">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-current opacity-80 group-hover:opacity-100"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.47 7.47 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                <span>{t('footerStar')}</span>
              </a>
            </div>
            <div className="md:ml-auto text-[11px] text-slate-500">
              {t('footerBy')} <a href="https://github.com/samusafe" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white font-medium">@samusafe</a>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}
