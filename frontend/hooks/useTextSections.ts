import { useMemo, useRef, useState, useCallback, useEffect } from 'react';

export function useTextSections(fullText: string | undefined) {
  const textSections = useMemo(() => {
    const full = fullText || '';
    if (!full) return [] as { id: string; title: string; content: string }[];
    const rawBlocks = full.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    let counter = 0;
    return rawBlocks.map(block => {
      counter += 1;
      const firstLine = block.split(/\n/)[0];
      const headingMatch = firstLine.match(/^#{1,6}\s+(.*)/);
      const title = headingMatch ? headingMatch[1].trim() : (firstLine.length > 80 ? firstLine.slice(0, 77) + '…' : firstLine);
      return { id: 'sec-' + counter, title, content: block };
    });
  }, [fullText]);

  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('');
  const handleScroll = useCallback(() => {
    if (!contentScrollRef.current) return;
    const nodes = Array.from(contentScrollRef.current.querySelectorAll('[data-section]')) as HTMLElement[];
    const top = contentScrollRef.current.scrollTop;
    let currentId = nodes[0]?.dataset.section || '';
    for (const el of nodes) {
      if (el.offsetTop - top <= 40) currentId = el.dataset.section || currentId; else break;
    }
    setActiveSection(currentId);
  }, []);
  useEffect(() => {
    const el = contentScrollRef.current; if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, textSections.length]);

  const scrollTo = (id: string) => {
    const el = contentScrollRef.current?.querySelector(`[data-section="${id}"]`);
    if (el && contentScrollRef.current) contentScrollRef.current.scrollTo({ top: (el as HTMLElement).offsetTop - 8, behavior: 'smooth' });
  };

  return { textSections, contentScrollRef, activeSection, scrollTo };
}
