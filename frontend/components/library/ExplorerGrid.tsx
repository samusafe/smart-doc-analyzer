"use client";

import { useEffect, useState, useCallback } from "react";
import { DocumentItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileText, RefreshCw, FolderPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { saveDocumentToCollection } from '@/api/documentsSave';
import { useAppLanguage, useT } from '@/components/providers/AppProviders';
import { getDocumentsCached, getCollectionsCached, invalidateDocumentsCache } from '@/lib/cache';

interface ExplorerGridProps {
  token?: string;
  dense?: boolean;
  onSelectDocument?: (documentId: number) => void;
}

export function ExplorerGrid({ token, dense, onSelectDocument }: ExplorerGridProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRefreshSkeleton, setShowRefreshSkeleton] = useState(false);
  const [collections, setCollections] = useState<{id:number; name:string;}[]>([]);
  const lang = useAppLanguage();
  const t = useT();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocumentsCached(token, lang);
      const safeItems = Array.isArray(res.items) ? res.items : [];
      setItems(safeItems);
      setTotal(typeof res.total === 'number' ? res.total : safeItems.length);
    } catch {
      setItems([]);
      setTotal(0);
      toast({ variant: "destructive", title: t('failedLoadDocuments') });
    } finally { setLoading(false); setShowRefreshSkeleton(false); }
  }, [token, toast, lang, t]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { getCollectionsCached(token, lang).then(c=> setCollections(c)); }, [token, lang]);
  useEffect(() => { // background soft revalidation after mount
    getDocumentsCached(token, lang, false, true).catch(()=>{});
  }, [token, lang]);

  return (
    <div className="flex flex-col h-full" aria-label="Explorer grid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">{t('allDocuments')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowRefreshSkeleton(true); invalidateDocumentsCache(); setRefreshKey(k => k + 1); }} disabled={loading} aria-label={t('refreshDocuments')} className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")}/>
          </button>
        </div>
      </div>
      <div className={cn("relative flex-1 rounded-md border border-dashed border-slate-600/60 p-2 overflow-auto")}> 
        {(loading && (showRefreshSkeleton || !items.length)) && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shrink-0 w-32 h-[110px] flex flex-col rounded-md border border-slate-600/60 bg-slate-800/40 p-2 gap-2 animate-pulse">
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2 w-2/5" />
              </div>
            ))}
          </div>
        )}
        {!loading && (!items || !items.length) && <p className="text-xs text-slate-500 p-4">{t('noDocuments')}</p>}
        {!loading && !!items.length && !showRefreshSkeleton && (
        <div className={cn("grid gap-3 auto-rows-[110px]", dense ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6")}>          
          {items && items.map(doc => (
            <div key={doc.id} onClick={() => onSelectDocument?.(doc.id)} className={cn("group relative flex flex-col rounded-md border border-slate-600/60 bg-slate-800/40 hover:bg-slate-700/70 transition p-2 text-xs cursor-pointer") } tabIndex={0}>
               <div className="flex-1 flex items-center justify-center text-indigo-300">
                 <FileText className="h-6 w-6" />
               </div>
               <div className="truncate font-medium text-slate-100" title={doc.fileName}>{doc.fileName}</div>
               <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                 <span>{doc.analysesCount}x</span>
                 {doc.lastAnalysisAt && <time>{new Date(doc.lastAnalysisAt).toLocaleDateString()}</time>}
               </div>
              {doc.collectionId ? (
                <span className="absolute top-1 right-1 text-[10px] px-1 rounded bg-indigo-600 text-white">{doc.collectionId}</span>
              ) : collections.length > 0 && (
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition flex flex-col justify-center items-center gap-1 p-2">
                  <div className="text-[10px] text-slate-300 mb-1">{t('saveToCollection')}</div>
                  <div className="flex flex-wrap gap-1 justify-center max-h-20 overflow-auto">
                    {collections.map(col => (
                      <button key={col.id} onClick={(e)=>{ e.stopPropagation(); saveDocumentToCollection(doc.id, col.id, token, lang).then(()=>{ toast({ variant:'success', title:`${t('savedTo')} ${col.name}` }); invalidateDocumentsCache(); setRefreshKey(k=>k+1); }).catch(err=> toast({ variant:'destructive', title: err.message })); }} className="px-2 py-0.5 text-[10px] rounded bg-indigo-600 text-white hover:bg-indigo-500">
                        {col.name}
                      </button>
                    ))}
                  </div>
                  <FolderPlus className="h-4 w-4 text-indigo-400 mt-1" />
                </div>
              )}
             </div>
           ))}
        </div>)}
      </div>
      <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
        <span>{t('total')}: {total}</span>
        <span className="hidden sm:inline">{t('selectDocumentHint')}</span>
      </div>
    </div>
  );
}
