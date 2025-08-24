import React from 'react';
import { useT } from '@/components/providers/AppProviders';

interface StatsTabProps { fullText?: string; keywordsCount: number; }
export const StatsTab: React.FC<StatsTabProps> = ({ fullText, keywordsCount }) => {
  const t = useT();
  const chars = fullText ? fullText.length : 0;
  const words = fullText ? fullText.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3 text-slate-300">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">{t('statistics') || 'Statistics'}</p>
      <ul className="text-xs space-y-1 text-slate-400">
        <li>Chars: {chars}</li>
        <li>Words: {words}</li>
        <li>Keywords: {keywordsCount}</li>
      </ul>
    </div>
  );
};
