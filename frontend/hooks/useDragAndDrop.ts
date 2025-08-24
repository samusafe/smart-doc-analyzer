import { useState, useCallback } from 'react';

export function useDragAndDrop(onFiles: (files: FileList) => void, disabled?: boolean) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }, [disabled, onFiles]);

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, [disabled]);

  return { dragActive, onDrop, onDrag };
}
