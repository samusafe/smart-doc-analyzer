import React, { useState } from 'react';
import { exportSummaryDocx, exportSummaryPdf } from '@/lib/export/summaryExport';
import { AnalysisResult } from '@/lib/types';
import { useT } from '@/components/providers/AppProviders';

interface SummaryTabProps { current: AnalysisResult; onGetExports?: (handlers: { exportDocx: () => Promise<void>; exportPdf: () => Promise<void>; }) => void; }
export const SummaryTab: React.FC<SummaryTabProps> = ({ current, onGetExports }) => {
  const t = useT();
  const data = current.data;
  const baseSummary = data?.summary || '';
  const [summaryLevel, setSummaryLevel] = useState<'detailed'|'short'|'bullet'>('detailed');
  // Simple derived variants (placeholder for future backend support)
  const summaryText = summaryLevel === 'short'
    ? baseSummary.split(/(?<=\.)\s+/).slice(0,2).join(' ') || baseSummary
    : summaryLevel === 'bullet'
      ? baseSummary.split(/(?<=\.)\s+/).slice(0,6).map(s => '• ' + s.trim()).join('\n')
      : baseSummary;

  const exportDocx = React.useCallback(async () => {
    try { await exportSummaryDocx(current, summaryText, data?.sentiment, t); }
    catch (e) { console.error('export docx failed', e); }
  }, [current, summaryText, data?.sentiment, t]);

  const exportPdf = React.useCallback(async () => {
    try { await exportSummaryPdf(current, summaryText, data?.sentiment, t); }
    catch (e) { console.error('export pdf failed', e); }
  }, [current, summaryText, data?.sentiment, t]);

  React.useEffect(() => { onGetExports?.({ exportDocx, exportPdf }); }, [onGetExports, exportDocx, exportPdf]);

  return (
    <div className="space-y-5 max-w-2xl">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-100 tracking-wide">{current.fileName}
        {current.reused && <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase tracking-wider">{t('reused')}</span>}
        {current.batchSize && current.batchSize > 1 && (
          <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-blue-200 text-blue-900 uppercase tracking-wider">{t('batch')} {current.batchSize}</span>
        )}
      </h3>
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1 font-medium text-slate-300">
            <span>{t('summaryLevel') || t('level')}</span>
            <select value={summaryLevel} onChange={e=>setSummaryLevel(e.target.value as 'detailed'|'short'|'bullet')} className="bg-slate-800/70 border border-slate-600/60 rounded px-1 py-0.5 focus:outline-none">
              <option value="detailed">{t('detailed')||'Detailed'}</option>
              <option value="short">{t('short')||'Short'}</option>
              <option value="bullet">{t('bullet')||'Bullets'}</option>
            </select>
          </label>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">{t('summary')}</p>
          <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{summaryText || t('dash')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90 flex items-center gap-2">{t('sentiment')}
            {data?.sentiment && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${data.sentiment.toLowerCase().includes('pos') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : data.sentiment.toLowerCase().includes('neg') ? 'bg-rose-500/15 text-rose-300 border-rose-400/30' : 'bg-slate-600/20 text-slate-300 border-slate-500/30'}`}>{data.sentiment}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          {/* replaced individual buttons by wrapper consumed by parent (kept for backward compatibility) */}
          {/* The parent now can render ExportMenu; fallback simple buttons removed for cleaner UI */}
        </div>
      </section>
    </div>
  );
};
