import React from 'react';
import { AnalysisResult } from '@/lib/types';
import { useT } from '@/components/providers/AppProviders';

interface FileSelectorBarProps {
  results: AnalysisResult[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}
export const FileSelectorBar: React.FC<FileSelectorBarProps> = ({ results, currentIndex, setCurrentIndex }) => {
  const t = useT();
  return (
    <div className="p-4 border-b border-slate-700/60 flex items-center gap-2 flex-wrap">
      {results.map((r, i) => (
        <button key={i} onClick={() => setCurrentIndex(i)} className={`px-2 py-1 rounded text-xs font-medium transition ${i === currentIndex ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-300'}`}>{r.fileName}{r.reused && <span className="ml-1 opacity-70">({t('reused').toLowerCase()})</span>}</button>
      ))}
    </div>
  );
};
