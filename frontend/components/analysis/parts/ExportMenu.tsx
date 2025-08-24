import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileDown } from 'lucide-react';

interface ExportMenuItem { key: string; label: string; onClick: () => void; icon?: React.ReactNode; }
interface ExportMenuProps { items: ExportMenuItem[]; buttonLabel?: string; }

export const ExportMenu: React.FC<ExportMenuProps> = ({ items, buttonLabel = 'Export' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative inline-block text-[11px]" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
        aria-haspopup="menu" aria-expanded={open} aria-label={buttonLabel}
      >
        <Download className="h-3.5 w-3.5" /> {buttonLabel}
        <span aria-hidden className="text-[10px] opacity-70">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 max-w-[220px] w-max rounded border border-slate-600 bg-slate-800/98 backdrop-blur p-1 shadow-lg focus:outline-none overflow-hidden" aria-label="Export format list">
          {items.map(i => (
            <button key={i.key} role="menuitem" onClick={() => { i.onClick(); setOpen(false); }}
              className="w-full flex items-center gap-2 text-left px-2 py-1 rounded text-[11px] hover:bg-slate-700/80 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 break-words">
              {i.icon || (i.key.includes('pdf') ? <FileDown className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />)}
              <span className="whitespace-normal leading-snug">{i.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
