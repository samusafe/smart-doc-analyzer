import React from 'react';
import { useT } from '@/components/providers/AppProviders';

interface KeywordsTabProps { keywords?: string[]; }
export const KeywordsTab: React.FC<KeywordsTabProps> = ({ keywords }) => {
  const t = useT();
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">{t('keywords')}</p>
      {keywords && keywords.length ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map(k => <span key={k} className="px-2 py-1 rounded bg-slate-800/70 border border-slate-600/60 text-[11px] text-slate-200">{k}</span>)}
        </div>
      ) : <p className="text-slate-400 text-xs italic">{t('noKeywordsFound') || 'No keywords identified for this document.'}</p>}
    </div>
  );
};
