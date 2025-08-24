import { useState, useCallback } from 'react';

interface Options { max?: number; onWarn?: (msg: string) => void; }

export function useFileQueue({ max = 10, onWarn }: Options = {}) {
  const [files, setFiles] = useState<File[]>([]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const unique = arr.filter(f => !prev.some(p => p.name === f.name && p.size === f.size));
      const next = [...prev, ...unique];
      if (next.length > max) {
        onWarn?.(`File limit exceeded (max ${max}).`);
        return prev;
      }
      if (unique.length < arr.length) onWarn?.('Duplicate files ignored.');
      return next;
    });
  }, [max, onWarn]);

  const replaceFiles = useCallback((incoming: File[]) => {
    const arr = Array.from(incoming).slice(0, max);
    if (incoming.length > max) onWarn?.(`Trimmed to first ${max} files.`);
    setFiles(arr);
  }, [max, onWarn]);

  const removeFile = useCallback((index: number) => setFiles(prev => prev.filter((_, i) => i !== index)), []);
  const clearFiles = useCallback(() => setFiles([]), []);

  return { files, addFiles, replaceFiles, removeFile, clearFiles };
}
