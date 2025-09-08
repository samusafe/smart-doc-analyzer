"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collection, DocumentItem } from "@/lib/types";
import { FolderClosedIcon, FolderOpenIcon, ChevronLeftIcon } from "@/components/icons";
import { RefreshCw } from "lucide-react";
import { useAppLanguage, useT, useAuthToken } from "@/components/providers/AppProviders";
import { listDocumentsInCollection } from "@/api/documents";
import { useDataStore } from '@/lib/store/data';

interface LibrarySidebarProps {
  onSelectCollection: (id: string | null, name?: string | null) => void;
  activeCollectionId: string | null;
}

export function LibrarySidebar({ onSelectCollection, activeCollectionId }: LibrarySidebarProps) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [docsLoading, setDocsLoading] = useState<Record<number, boolean>>({});
  const [collectionDocs, setCollectionDocs] = useState<Record<number, DocumentItem[]>>({});
  const lang = useAppLanguage();
  const t = useT();
  const authToken = useAuthToken();

  const {
    collections,
    loadingCollections,
    errorCollections,
    fetchCollections,
    deleteCollection,
    createCollection,
  } = useDataStore();

  useEffect(() => {
    if (authToken && collections.length === 0) {
      fetchCollections(authToken, lang).catch((err) => {
        toast({ variant: "destructive", title: t('failedLoadCollections'), description: err.message });
      });
    }
  }, [authToken, collections.length, fetchCollections, lang, toast, t]);

  const resetAdd = () => { setAdding(false); setNewName(""); setFormError(null); };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    const trimmed = newName.trim();
    if (!trimmed) { setFormError(t('nameRequired')); return; }
    toast({ title: t('creatingCollection') });
    try {
      await createCollection(trimmed, authToken, lang);
      toast({ variant: "success", title: t('collectionCreated') });
      resetAdd();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('failedCreateCollection');
      setFormError(msg);
      toast({ variant: "destructive", title: msg });
    }
  };

  const handleRemove = async (id: number) => {
    if (!authToken) return;
    // Basic confirmation, can be replaced with a modal
    if (!window.confirm(t('confirmRemoveCollection'))) return;
    toast({ title: t('removingCollection') });
    try {
      await deleteCollection(id, authToken, lang);
      if (activeCollectionId === String(id)) onSelectCollection(null, null);
      toast({ variant: "success", title: t('collectionRemoved') });
    } catch (e) {
      const error = e instanceof Error ? e.message : t('failedRemoveCollection');
      toast({ variant: "destructive", title: error });
    }
  };

  const handleRefresh = () => {
    if (authToken) {
      fetchCollections(authToken, lang).catch((err) => {
        toast({ variant: "destructive", title: t('failedLoadCollections'), description: err.message });
      });
    }
  };

  const toggleExpand = async (col: Collection) => {
    setExpanded(prev => ({ ...prev, [col.id]: !prev[col.id] }));
    const willOpen = !expanded[col.id];
    if (willOpen && !collectionDocs[col.id] && col.documents > 0) {
      setDocsLoading(d => ({ ...d, [col.id]: true }));
      try {
        if (!authToken) throw new Error(t('notLoggedIn'));
        const res = await listDocumentsInCollection(col.id, { token: authToken, lang });
        setCollectionDocs(d => ({ ...d, [col.id]: res.items }));
      } catch {
        toast({ variant: 'destructive', title: t('failedLoadDocuments') });
      } finally {
        setDocsLoading(d => ({ ...d, [col.id]: false }));
      }
    }
  };

  return (
    <aside className="flex flex-col w-full shrink-0 gap-4" aria-label="User library sidebar">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('library')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} aria-label={t('refreshCollections')} className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition relative disabled:opacity-50" disabled={loadingCollections}>
            <RefreshCw className={cn("h-4 w-4", loadingCollections && "animate-spin")}/>
          </button>
          {!adding && (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setAdding(true)} aria-label={t('creatingCollection')}>+ {t('new')}</Button>
          )}
        </div>
      </div>
      {adding && (
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input autoFocus value={newName} onChange={e => { setNewName(e.target.value); setFormError(null); }} placeholder={t('collectionName')} aria-label={t('collectionName')} className="flex-1 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <Button size="sm" type="submit" className="cursor-pointer">{t('add')}</Button>
          <button type="button" onClick={resetAdd} aria-label={t('cancel')} className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-gray-50 text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </form>
      )}
      {formError && <p role="alert" className="text-xs text-red-600 -mt-1">{formError}</p>}

      {/* Breadcrumb / navigation */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300" aria-label="Breadcrumb navigation">
        {activeCollectionId ? (
          <>
            <button onClick={() => onSelectCollection(null, null)} aria-label={t('backAllDocuments')} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transition shadow border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-900">
              <ChevronLeftIcon />
              {t('back')}
            </button>
            <span className="text-indigo-300/90 flex items-center gap-1">
              <span className="font-semibold tracking-wide">{t('allDocuments')}</span>
              <span className="opacity-60">/</span>
            </span>
            <span className="font-semibold text-slate-100 truncate max-w-[140px]" title="Active collection">
              {collections.find(c=> String(c.id)===activeCollectionId)?.name || t('collectionName')}
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm shadow-sm border border-indigo-400/40 tracking-wide">
            {t('allDocuments')}
          </span>
        )}
      </div>

      {(loadingCollections && collections.length === 0) && (
        <div className="space-y-2" aria-label={t('loading')}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      )}
      {errorCollections && <p className="text-xs text-red-500 p-4">{errorCollections}</p>}
      <nav className="flex flex-col gap-1 overflow-y-auto" aria-label="Collections list">
        {!loadingCollections && collections.map(col => {
          const safeId = col.id;
          const isActive = String(safeId) === activeCollectionId;
          const name = col.name || t('unnamed');
          const documents = col.documents ?? 0;
          return (
            <div key={safeId} className="group w-full">
              <div className="flex items-center gap-2">
                <button onClick={() => { onSelectCollection(isActive ? null : String(safeId), isActive ? null : name); toggleExpand(col); }}
                  className={cn(
                    "relative flex-1 flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 border",
                    isActive
                      ? "bg-indigo-600/90 text-white shadow border-indigo-500/70"
                      : "bg-slate-800/40 hover:bg-slate-700/50 text-slate-200 border-slate-700/40"
                  )}
                  aria-pressed={isActive}
                  aria-label={`${t('selectCollection')} ${name}`}
                >
                  {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l bg-gradient-to-b from-indigo-300 to-indigo-500" aria-hidden="true" />}
                  <span className="truncate flex items-center gap-2 pl-0.5">{expanded[col.id] ? <FolderOpenIcon/> : <FolderClosedIcon/>}{name}</span>
                  <span className={cn("ml-2 shrink-0 text-xs font-semibold rounded-full px-2 py-0.5",
                    isActive ? "bg-indigo-500/70 text-white/90" : "bg-slate-700/60 text-slate-300")}>{documents}</span>
                </button>
                <button onClick={() => handleRemove(safeId)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 focus:opacity-100 focus:outline-none" aria-label={t('removeCollection') + ' ' + name} title={t('remove')}>×</button>
              </div>
              {expanded[col.id] && (
                <div className="ml-3 mt-1 mb-2 space-y-1 border-l border-slate-700/60 pl-3">
                  {docsLoading[col.id] && (
                    <div className="space-y-1" aria-label={t('folderDocumentsLoading')}>
                      {Array.from({ length: 3 }).map((_,i)=>(<Skeleton key={i} className="h-4 w-5/6 bg-slate-700/60"/>))}
                    </div>
                  )}
                  {!docsLoading[col.id] && collectionDocs[col.id] && collectionDocs[col.id].length === 0 && (
                    <div className="text-xs text-slate-500 italic">{t('folderNoDocuments')}</div>
                  )}
                  {!docsLoading[col.id] && collectionDocs[col.id]?.map(doc => (
                    <button
                      key={doc.id}
                      className="block w-full text-left text-xs px-2 py-1 rounded-md bg-slate-800/30 hover:bg-slate-700/60 text-slate-300 hover:text-slate-100 transition truncate"
                      onClick={() => onSelectCollection(String(safeId), name)}
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto text-xs text-gray-400 leading-relaxed space-y-1">
        <p>{t('libraryTips')}</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{t('tipClickCollection')}</li>
          <li>{t('tipOpenItem')}</li>
        </ul>
      </div>
    </aside>
  );
}
