import { useState, useEffect, useMemo, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';

export interface Note { id: string; sectionId: string; text: string; createdAt: number; updatedAt: number; }

export function useNotes(currentFileName: string | undefined, fullText: string | undefined) {
  const docKey = useMemo(() => {
    const base = currentFileName || 'doc';
    const len = (fullText || '').length;
    let hash = 0; const content = (fullText || '').slice(0, 512);
    for (let i = 0; i < content.length; i++) { hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0; }
    return `${STORAGE_KEYS.notesPrefix}${base}::${len}::${hash}`;
  }, [currentFileName, fullText]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteDrafts, setNewNoteDrafts] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(docKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Note[];
        setNotes(Array.isArray(parsed) ? parsed : []);
      } else setNotes([]);
      setNewNoteDrafts({});
      setEditingNoteId(null);
    } catch { setNotes([]); }
  }, [docKey]);

  useEffect(() => { try { localStorage.setItem(docKey, JSON.stringify(notes)); } catch { /* ignore */ } }, [docKey, notes]);

  const addNote = (sectionId: string) => {
    const draft = newNoteDrafts[sectionId];
    if (!draft || !draft.trim()) return;
    const now = Date.now();
    setNotes(n => [{ id: String(now), sectionId, text: draft.trim(), createdAt: now, updatedAt: now }, ...n]);
    setNewNoteDrafts(d => ({ ...d, [sectionId]: '' }));
  };
  const startEditNote = (note: Note) => { setEditingNoteId(note.id); setEditingDraft(note.text); };
  const saveEditNote = () => {
    if (!editingNoteId) return;
    setNotes(n => n.map(note => note.id === editingNoteId ? { ...note, text: editingDraft.trim(), updatedAt: Date.now() } : note));
    setEditingNoteId(null); setEditingDraft('');
  };
  const deleteNote = (id: string) => setNotes(n => n.filter(note => note.id !== id));
  const sectionNotes = useCallback((sectionId: string) => notes.filter(n => n.sectionId === sectionId), [notes]);

  return { notes, newNoteDrafts, setNewNoteDrafts, editingNoteId, editingDraft, setEditingDraft, setEditingNoteId, addNote, startEditNote, saveEditNote, deleteNote, sectionNotes };
}
