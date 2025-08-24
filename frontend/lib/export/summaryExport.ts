import type { AnalysisResult } from '@/lib/types';
import type { Paragraph as DocxParagraph } from 'docx';

// Optional translator function for i18n
type TFn = (k: string) => string;

function buildFilename(base: string, kind: string, ext: string) {
  const ts = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`;
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0,60) || 'export';
  return `${safeBase}_${stamp}_${kind}.${ext}`;
}

// Helpers to export summary to DOCX / PDF centralizing duplicated logic
export async function exportSummaryDocx(result: AnalysisResult, summaryText: string, sentiment?: string, t?: TFn) {
  const fileBase = (result.fileName || 'summary').replace(/\.[^.]+$/, '');
  try {
    const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');
    const paragraphs: DocxParagraph[] = [];
    paragraphs.push(new Paragraph({ text: result.fileName, heading: HeadingLevel.TITLE }));
    paragraphs.push(new Paragraph({ text: '' }));
    paragraphs.push(new Paragraph({ text: t ? t('summary') : 'Summary', heading: HeadingLevel.HEADING_2 }));
    if (/^• /.test(summaryText)) {
      summaryText.split(/\n/).forEach(line => paragraphs.push(new Paragraph({ text: line.replace(/^•\s?/, ''), bullet: { level: 0 } })));
    } else {
      summaryText.split(/\n+/).forEach(block => paragraphs.push(new Paragraph({ children: [ new TextRun(block) ] })));
    }
    if (sentiment) {
      paragraphs.push(new Paragraph({ text: '' }));
      paragraphs.push(new Paragraph({ text: (t ? t('sentiment') : 'Sentiment') + ': ' + sentiment }));
    }
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, buildFilename(fileBase, 'summary', 'docx'));
  } catch {}
}

export async function exportSummaryPdf(result: AnalysisResult, summaryText: string, sentiment?: string, t?: TFn) {
  const fileBase = (result.fileName || 'summary').replace(/\.[^.]+$/, '');
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const lineHeight = 14; const left = 40; let top = 50; const maxWidth = 515;
    doc.setFontSize(14); doc.text(result.fileName, left, top); top += 24;
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(summaryText || '-', maxWidth) as string[];
    lines.forEach(line => { if (top > 780) { doc.addPage(); top = 50; } doc.text(line, left, top); top += lineHeight; });
    if (sentiment) { if (top > 760) { doc.addPage(); top = 50; } top += 10; doc.setFontSize(10); doc.text(`${t ? t('sentiment') : 'Sentiment'}: ${sentiment}`, left, top); }
    doc.save(buildFilename(fileBase, 'summary', 'pdf'));
  } catch {}
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
