import { useCallback, useState } from 'react';

export interface Crumb { label: string; onClick?: () => void; }

export function useBreadcrumb() {
  const [collection, setCollection] = useState<{id: string|null; name: string|null}>({ id: null, name: null });
  const set = useCallback((id: string|null, name: string|null)=> setCollection({ id, name }), []);
  const crumbs: Crumb[] = collection.id ? [
    { label: 'All Documents', onClick: () => set(null, null) },
    { label: collection.name || 'Collection' }
  ] : [ { label: 'All Documents' } ];
  return { collection, setCollection: set, crumbs };
}
