import { useState, useCallback } from 'react';

export function useMultiSelect() {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = useCallback((id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]), []);
  const clear = useCallback(()=> setSelected([]), []);
  return { selected, toggle, clear };
}
