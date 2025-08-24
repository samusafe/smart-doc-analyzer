import type { Paragraph as DocxParagraph } from 'docx';
import type { Note } from '@/hooks/useNotes';

// Accept optional translator for i18n
type TFn = (k: string) => string;

function buildFilename(base: string, kind: string, ext: string) {
  const ts = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0,60) || 'export';
  return `${safeBase}_${stamp}_${kind}.${ext}`;
}

export async function exportNotesDocx(notes: Note[], sections: {id:string; title:string}[], t?: TFn) {
  try {
    const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');
    const children: DocxParagraph[] = [];
    children.push(new Paragraph({ text: t ? t('notes') : 'Notes', heading: HeadingLevel.TITLE }));
    if (!notes.length) children.push(new Paragraph({ text: t ? t('noNotesAddFirst') : 'No notes yet.' }));
    sections.forEach(sec => {
      const secNotes = notes.filter(n => n.sectionId === sec.id);
      if (!secNotes.length) return;
      children.push(new Paragraph({ text: sec.title, heading: HeadingLevel.HEADING_2 }));
      secNotes.forEach(n => children.push(new Paragraph({ children: [ new TextRun(n.text) ] })));
    });
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, buildFilename('notes', 'notes', 'docx'));
  } catch {}
}

export async function exportNotesPdf(notes: Note[], sections: {id:string; title:string}[], t?: TFn) {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40; let top = 50; const lineHeight = 14; const maxWidth = 515;
    doc.setFontSize(16); doc.text(t ? t('notes') : 'Notes', left, top); top += 24; doc.setFontSize(11);
    if (!notes.length) { doc.text(t ? t('noNotesAddFirst') : 'No notes yet.', left, top); doc.save(buildFilename('notes','notes','pdf')); return; }
    sections.forEach(sec => {
      const secNotes = notes.filter(n => n.sectionId === sec.id);
      if (!secNotes.length) return;
      if (top > 760) { doc.addPage(); top = 50; }
      doc.setFontSize(12); doc.text(sec.title, left, top); top += 18; doc.setFontSize(11);
      secNotes.forEach(n => {
        const lines: string[] = doc.splitTextToSize(n.text, maxWidth) as string[];
        lines.forEach(line => { if (top > 780) { doc.addPage(); top = 50; } doc.text(line, left, top); top += lineHeight; });
        top += 6;
      });
      top += 4;
    });
    doc.save(buildFilename('notes','notes','pdf'));
  } catch {}
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
