import React from 'react';
import { exportNotesDocx, exportNotesPdf } from '@/lib/export/notesExport';
import { Note } from '@/hooks/useNotes';
import { useT } from '@/components/providers/AppProviders';

interface NotesTabProps {
  notes: Note[];
  textSections: { id: string; title: string; content: string }[];
  setActiveTab: (id: string) => void;
  setEditingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingDraft: (v: string) => void;
  deleteNote: (id: string) => void;
  editingDraft: string; // not used but could be passed for future features
  onGetExports?: (handlers: { exportNotesDocx: () => Promise<void>; exportNotesPdf: () => Promise<void>; }) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ notes, textSections, setActiveTab, setEditingNoteId, setEditingDraft, deleteNote, onGetExports }) => {
  const t = useT();

  React.useEffect(() => {
    const exportNotesDocxHandler = async () => { await exportNotesDocx(notes, textSections.map(s=>({id:s.id,title:s.title})), t); };
    const exportNotesPdfHandler = async () => { await exportNotesPdf(notes, textSections.map(s=>({id:s.id,title:s.title})), t); };
    onGetExports?.({ exportNotesDocx: exportNotesDocxHandler, exportNotesPdf: exportNotesPdfHandler });
  }, [notes, textSections, onGetExports, t]);

  return (
    <div className="space-y-5 max-w-3xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300/90">{t('notes')} ({notes.length})</h3>
      {notes.length === 0 && <p className="text-xs text-slate-500 italic">{t('noNotesAddFirst')}</p>}
      {notes.length > 0 && (
        <div className="space-y-4">
          {textSections.map(sec => {
            const secNotes = notes.filter(n => n.sectionId === sec.id);
            if (!secNotes.length) return null;
            return (
              <div key={sec.id} className="border border-slate-700/50 rounded p-3 bg-slate-800/40">
                <p className="text-[11px] font-semibold text-slate-200 mb-2">{sec.title}</p>
                <div className="space-y-2">
                  {secNotes.map(note => (
                    <div key={note.id} className="text-[11px] leading-snug whitespace-pre-wrap bg-slate-900/50 border border-slate-700/40 rounded p-2 flex justify-between gap-3">
                      <span className="text-slate-200 flex-1">{note.text}</span>
                      <div className="flex gap-1 opacity-60">
                        <button onClick={() => { setActiveTab('text'); setEditingNoteId(note.id); setEditingDraft(note.text); }} className="px-1 py-0.5 text-[10px] rounded bg-slate-700/60 hover:bg-slate-600 text-slate-200">{t('edit')}</button>
                        <button onClick={() => deleteNote(note.id)} className="px-1 py-0.5 text-[10px] rounded bg-rose-600/70 hover:bg-rose-500 text-white">{t('delete')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
