import React from 'react';
import { Note } from '@/hooks/useNotes';
import { useT } from '@/components/providers/AppProviders';

interface TextTabProps {
  textSections: { id: string; title: string; content: string }[];
  activeSection: string;
  scrollTo: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchMatches: number[];
  nextMatch: () => void;
  prevMatch: () => void;
  keywordHighlight: boolean;
  setKeywordHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  notes: Note[];
  sectionNotes: (sectionId: string) => Note[];
  newNoteDrafts: Record<string, string>;
  setNewNoteDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addNote: (sectionId: string) => void;
  editingNoteId: string | null;
  editingDraft: string;
  setEditingDraft: (v: string) => void;
  setEditingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  saveEditNote: () => void;
  deleteNote: (id: string) => void;
  contentScrollRef: React.RefObject<HTMLDivElement>;
  renderContent: (content: string) => React.ReactNode;
  openNotesTab?: () => void;
}

export const TextTab: React.FC<TextTabProps> = ({
  textSections,
  activeSection,
  scrollTo,
  searchQuery,
  setSearchQuery,
  searchMatches,
  nextMatch,
  prevMatch,
  keywordHighlight,
  setKeywordHighlight,
  notes,
  sectionNotes,
  newNoteDrafts,
  setNewNoteDrafts,
  addNote,
  editingNoteId,
  editingDraft,
  setEditingDraft,
  setEditingNoteId,
  saveEditNote,
  deleteNote,
  contentScrollRef,
  renderContent,
  openNotesTab
}) => {
  const t = useT();
  return (
    <div className="flex h-full gap-4" role="region" aria-label={t('fullText') || 'Full text'}>
      {/* TOC */}
      <div className="hidden md:flex flex-col w-56 shrink-0 border-r border-slate-600 pr-3 overflow-auto text-xs max-h-[calc(100vh-340px)]" role="navigation" aria-label={t('contents') || 'Contents'}>
        <div className="mb-3 space-y-2">
          <p className="font-semibold uppercase tracking-wider text-indigo-200">{t('contents') || 'Contents'}</p>
          {/* Search bar with icon + clear */}
          <div className="flex items-center gap-1 relative group/search">
            <span className="absolute left-2 text-slate-400 text-[11px] pointer-events-none" aria-hidden>🔍</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search') || 'Search'}
              aria-label={t('search') || 'Search'}
              className="w-full bg-slate-800/80 border border-slate-500 rounded pl-6 pr-6 py-1 text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label={t('clearSearch') || 'Clear search'} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] px-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70">×</button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between text-[10px] text-slate-400" aria-live="polite">
              <span>{searchMatches.length} {t('matches') || 'matches'}</span>
              <div className="flex gap-1">
                <button onClick={prevMatch} className="px-1 py-0.5 bg-slate-700 rounded hover:bg-slate-600 text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70" aria-label={t('previousMatch') || 'Previous match'}>↑</button>
                <button onClick={nextMatch} className="px-1 py-0.5 bg-slate-700 rounded hover:bg-slate-600 text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70" aria-label={t('nextMatch') || 'Next match'}>↓</button>
              </div>
            </div>
          )}
          {/* Keyword highlight toggle icon */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setKeywordHighlight(v => !v)}
              title={keywordHighlight ? (t('hideKeywordsHighlight') || 'Hide keyword highlights') : (t('highlightKeywords') || 'Highlight keywords')}
              aria-pressed={keywordHighlight}
              className={`inline-flex items-center justify-center h-7 w-7 rounded border transition text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${keywordHighlight ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow' : 'bg-slate-800/70 border-slate-600 text-slate-200 hover:bg-slate-700'}`}
            >
              {keywordHighlight ? '✧' : '☆'}
            </button>
            <div className="text-[10px] text-slate-400" aria-live="polite">{notes.length} {(t('notes') || 'Notes')}</div>
          </div>
        </div>
        <ul className="space-y-1">
          {textSections.map(sec => (
            <li key={sec.id}>
              <button
                onClick={() => scrollTo(sec.id)}
                className={`text-left w-full rounded px-2 py-1 leading-snug transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${activeSection === sec.id ? 'bg-indigo-600 text-white shadow' : 'hover:bg-slate-700/70 text-slate-200'}`}
                title={sec.title}
                aria-current={activeSection === sec.id ? 'true' : 'false'}
              >{sec.title}</button>
              {sectionNotes(sec.id).length > 0 && <span className="ml-1 text-[10px] text-fuchsia-300">•{sectionNotes(sec.id).length}</span>}
            </li>
          ))}
          {!textSections.length && <li className="text-slate-500 italic text-[11px]">{t('noSections') || 'No sections detected.'}</li>}
        </ul>
      </div>
      {/* Text content */}
      <div ref={contentScrollRef} className="flex-1 overflow-auto rounded border border-slate-600 bg-slate-800/40 p-4 space-y-6 text-xs leading-relaxed max-h-[calc(100vh-320px)] relative" id="panel-text" role="tabpanel" aria-label={t('fullText') || 'Full text'}>
        {notes.length > 0 && openNotesTab && (
          <button onClick={openNotesTab} className="fixed bottom-6 right-6 md:right-10 z-10 shadow-md px-3 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70">
            {t('notes') || 'Notes'} ({notes.length})
          </button>
        )}
        {textSections.length ? textSections.map(sec => {
          const secNotes = sectionNotes(sec.id);
          return (
            <div key={sec.id} data-section={sec.id} className="scroll-mt-16 group">
              <div className="flex items-start justify-between mb-1">
                <p className="font-semibold text-slate-200 text-[11px] tracking-wide">{sec.title}</p>
                <button onClick={() => setNewNoteDrafts(d => ({ ...d, [sec.id]: d[sec.id] !== undefined ? d[sec.id] : '' }))} className="opacity-0 group-hover:opacity-100 transition text-[10px] px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-600 text-slate-200">{t('addNote') || 'Add note'}</button>
              </div>
              <div className="whitespace-pre-wrap text-slate-300 mb-2">{renderContent(sec.content)}</div>
              {newNoteDrafts.hasOwnProperty(sec.id) && (
                <div className="mb-3 space-y-2">
                  <textarea
                    value={newNoteDrafts[sec.id]}
                    onChange={e => setNewNoteDrafts(d => ({ ...d, [sec.id]: e.target.value }))}
                    placeholder={t('notePlaceholder') || 'Write a note...'}
                    className="w-full resize-y rounded bg-slate-900/60 border border-slate-600/60 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => addNote(sec.id)} className="px-2 py-0.5 text-[10px] rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50" disabled={!newNoteDrafts[sec.id]?.trim()}>{t('save') || 'Save'}</button>
                    <button onClick={() => setNewNoteDrafts(d => { const copy = { ...d }; delete copy[sec.id]; return copy; })} className="px-2 py-0.5 text-[10px] rounded bg-slate-700 text-slate-200 hover:bg-slate-600">{t('cancel') || 'Cancel'}</button>
                  </div>
                </div>
              )}
              {secNotes.length > 0 && (
                <div className="space-y-2 border-l border-slate-700/50 pl-3">
                  {secNotes.map(note => (
                    <div key={note.id} className="relative group/note bg-slate-900/40 rounded p-2 border border-slate-700/40">
                      {editingNoteId === note.id ? (
                        <div className="space-y-1">
                          <textarea
                            value={editingDraft}
                            onChange={e => setEditingDraft(e.target.value)}
                            className="w-full resize-y rounded bg-slate-950/60 border border-slate-600/60 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={saveEditNote} disabled={!editingDraft.trim()} className="px-2 py-0.5 text-[10px] rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">{t('save') || 'Save'}</button>
                            <button onClick={() => { setEditingNoteId(null); setEditingDraft(''); }} className="px-2 py-0.5 text-[10px] rounded bg-slate-700 text-slate-200 hover:bg-slate-600">{t('cancel') || 'Cancel'}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] leading-snug whitespace-pre-wrap text-slate-200">{note.text}</p>
                          <div className="mt-1 flex gap-2 opacity-0 group-hover/note:opacity-100 transition">
                            <button onClick={() => { setEditingNoteId(note.id); setEditingDraft(note.text); }} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-slate-600 text-slate-200">{t('edit') || 'Edit'}</button>
                            <button onClick={() => deleteNote(note.id)} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600/70 hover:bg-rose-500 text-white">{t('delete') || 'Delete'}</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="text-center py-20 text-slate-400 text-[12px]">
            <p className="mb-2 font-medium text-slate-200">{t('noTextSections') || 'No text available to display.'}</p>
            <p className="opacity-70">{t('uploadDocumentHint') || 'Upload a document or return to the summary tab.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
