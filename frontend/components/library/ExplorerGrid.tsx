"use client";

import { useEffect, useState } from "react";
import { DocumentItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileText, RefreshCw, FolderPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppLanguage, useT, useAuthToken } from '@/components/providers/AppProviders';
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import { useDataStore } from '@/lib/store/data';

interface ExplorerGridProps {
  dense?: boolean;
  onSelectDocument?: (documentId: number) => void;
}

export function ExplorerGrid({ dense, onSelectDocument }: ExplorerGridProps) {
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const lang = useAppLanguage();
  const t = useT();
  const authToken = useAuthToken();

  const {
    documents,
    collections,
    loadingDocuments,
    errorDocuments,
    fetchDocuments,
    saveDocumentToCollection,
  } = useDataStore();

  useEffect(() => {
    if (authToken && documents.length === 0) {
      fetchDocuments(authToken, lang).catch(err => {
        toast({ variant: "destructive", title: t('failedLoadDocuments'), description: err.message });
      });
    }
  }, [authToken, documents.length, fetchDocuments, lang, toast, t]);

  const handleSaveToCollection = async (collectionId: number) => {
    if (!selectedDoc || !authToken) return;
    try {
      await saveDocumentToCollection(selectedDoc.id, collectionId, authToken, lang);
      toast({ variant: 'success', title: `${t('savedTo')} ${collections.find(c => c.id === collectionId)?.name}` });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: t('failedSaveToCollection'), description: error });
    } finally {
      setSelectedDoc(null);
    }
  };

  const handleRefresh = () => {
    if (authToken) {
      fetchDocuments(authToken, lang).catch((err) => {
        toast({ variant: "destructive", title: t('failedLoadDocuments'), description: err.message });
      });
    }
  };

  return (
    <div className="flex flex-col h-full" aria-label="Explorer grid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">{t('allDocuments')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={loadingDocuments} aria-label={t('refreshDocuments')} className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loadingDocuments && "animate-spin")}/>
          </button>
        </div>
      </div>
      <div className={cn("relative flex-1 rounded-md border border-dashed border-slate-600/60 p-2 overflow-auto")}>
        {(loadingDocuments && documents.length === 0) && (
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
        {!loadingDocuments && errorDocuments && <p className="text-xs text-red-500 p-4">{errorDocuments}</p>}
        {!loadingDocuments && !errorDocuments && documents.length === 0 && <p className="text-xs text-slate-500 p-4">{t('noDocuments')}</p>}
        {!loadingDocuments && !errorDocuments && documents.length > 0 && (
        <div className={cn("grid gap-3 auto-rows-[110px]", dense ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6")}>
          {documents.map(doc => (
            <div key={doc.id} className={cn("group relative flex flex-col rounded-md border border-slate-600/60 bg-slate-800/40 hover:bg-slate-700/70 transition p-2 text-xs") } tabIndex={0}>
               <div onClick={() => onSelectDocument?.(doc.id)} className="flex-1 flex items-center justify-center text-indigo-300 cursor-pointer">
                 <FileText className="h-6 w-6" />
               </div>
               <div className="truncate font-medium text-slate-100" title={doc.fileName}>{doc.fileName}</div>
               <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                 <span>{doc.analysesCount}x</span>
                 {doc.lastAnalysisAt && <time>{new Date(doc.lastAnalysisAt).toLocaleDateString()}</time>}
               </div>
              {doc.collectionId ? (
                <span className="absolute top-1 right-1 text-[10px] px-1 rounded bg-indigo-600 text-white">{collections.find(c => c.id === doc.collectionId)?.name || doc.collectionId}</span>
              ) : collections.length > 0 && (
                <button onClick={() => setSelectedDoc(doc)} className="absolute top-1 right-1 p-1 rounded-full bg-slate-700/80 text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors">
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              )}
             </div>
           ))}
        </div>)}
      </div>
      <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
        <span>{t('total')}: {documents.length}</span>
        <span className="hidden sm:inline">{t('selectDocumentHint')}</span>
      </div>
      {selectedDoc && (
        <AddToCollectionDialog
          collections={collections}
          onConfirm={handleSaveToCollection}
          onCancel={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
