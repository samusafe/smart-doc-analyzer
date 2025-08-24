import React from 'react';
import { Button } from '@/components/ui/Button';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { XIcon } from '@/components/icons';
import { useT } from '@/components/providers/AppProviders';

interface FileUploadPanelProps {
  files: File[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  analyze: () => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  loadedDocNames?: string[];
  onRemoveLoadedDoc?: (index: number) => void;
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ files, addFiles, removeFile, clearFiles, analyze, isLoading, disabled, loadedDocNames, onRemoveLoadedDoc }) => {
  const { dragActive, onDrop, onDrag } = useDragAndDrop(addFiles, disabled || isLoading);
  const t = useT();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-900/60 to-slate-900 shadow-inner overflow-hidden">
      <div
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        role="button"
        aria-label="File drop zone"
        onClick={() => { if (!(disabled || isLoading)) document.getElementById('file-input-main')?.click(); }}
        className={`relative flex-1 flex flex-col items-center justify-center p-6 text-center transition border-b border-slate-700/50 ${dragActive ? 'bg-slate-800/70' : 'bg-slate-800/30'} ${(disabled || isLoading) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-800/50'}`}
      >
        <input
          id="file-input-main"
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled || isLoading}
            aria-hidden="true"
          />
        <div className="pointer-events-none select-none space-y-3">
          <div className="text-sm font-medium text-slate-200">{t('dragDrop')}</div>
          <div className="text-xs text-slate-400">{t('orBrowse')}</div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {files.length > 0 && (
          <ul className="text-xs space-y-1 max-h-40 overflow-auto rounded border border-slate-700/50 divide-y divide-slate-700/30" aria-label="Selected files">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/50 group">
                <span className="truncate max-w-[70%]" title={f.name}>{f.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  disabled={isLoading}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-700/70 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                  aria-label={`${t('remove')} ${f.name}`}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length === 0 && loadedDocNames && loadedDocNames.length > 0 && (
          <ul className="text-xs space-y-1 max-h-40 overflow-auto rounded border border-slate-700/50 divide-y divide-slate-700/30" aria-label="Loaded documents">
            {loadedDocNames.map((name, i) => (
              <li key={i} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800/40 group">
                <span className="truncate max-w-[70%]" title={name}>{name}</span>
                {onRemoveLoadedDoc && (
                  <button
                    onClick={() => onRemoveLoadedDoc(i)}
                    disabled={isLoading}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-700/70 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition disabled:opacity-40"
                    aria-label={`${t('remove')} ${name}`}
                  >
                    <XIcon />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={clearFiles} disabled={(files.length === 0 && (!loadedDocNames || !loadedDocNames.length)) || isLoading}>{t('clear')}</Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={analyze} disabled={!files.length || isLoading}>{isLoading ? t('analyzing') : t('analyze')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
