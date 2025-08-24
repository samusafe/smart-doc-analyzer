import React, { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';

export function useSearchAndHighlight(fullText: string | undefined, keywords: string[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [keywordHighlight, setKeywordHighlight] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEYS.keywordsHighlight) === '1';
    return false;
  });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.keywordsHighlight, keywordHighlight ? '1' : '0'); } catch {} }, [keywordHighlight]);

  useEffect(() => {
    if (!searchQuery) { setSearchMatches([]); setCurrentMatch(0); return; }
    const indices: number[] = [];
    const full = fullText || '';
    const lowerFull = full.toLowerCase();
    const qLower = searchQuery.toLowerCase();
    let pos = lowerFull.indexOf(qLower);
    while (pos !== -1) { indices.push(pos); pos = lowerFull.indexOf(qLower, pos + qLower.length); }
    setSearchMatches(indices); setCurrentMatch(0);
  }, [searchQuery, fullText]);

  const nextMatch = () => setCurrentMatch(m => (m + 1 < searchMatches.length ? m + 1 : 0));
  const prevMatch = () => setCurrentMatch(m => (m - 1 >= 0 ? m - 1 : (searchMatches.length ? searchMatches.length - 1 : 0)));

  const renderContent = useCallback((content: string) => {
    if (!content) return null;
    const words = (keywords || []).filter(k => k && k.length > 1);
    if (searchQuery) {
      const parts: React.ReactNode[] = []; const qLower = searchQuery.toLowerCase();
      let cursor = 0; const lower = content.toLowerCase();
      while (true) {
        const found = lower.indexOf(qLower, cursor); if (found === -1) break;
        const before = content.slice(cursor, found); if (before) parts.push(React.createElement('span', { key: cursor + 'b' }, before));
        const matchText = content.slice(found, found + searchQuery.length);
        parts.push(React.createElement('mark', { key: found + 'm', className: 'rounded px-0.5 bg-yellow-600/70 text-black' }, matchText));
        cursor = found + searchQuery.length;
      }
      const tail = content.slice(cursor); if (tail) parts.push(React.createElement('span', { key: cursor + 't' }, tail));
      return React.createElement(React.Fragment, null, parts);
    }
    if (keywordHighlight && words.length) {
      const escaped = words.slice().sort((a,b)=>b.length-a.length).map(k=>k.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'));
      const regex = new RegExp('(' + escaped.join('|') + ')', 'gi');
      const segments = content.split(regex);
      return React.createElement(React.Fragment, null, segments.map((seg,i)=>{
        if(!seg) return null; const isKw = regex.test(seg) && words.some(k=>k.toLowerCase()===seg.toLowerCase());
        return isKw ? React.createElement('span', { key: i, className: 'bg-fuchsia-600/30 text-fuchsia-200 rounded px-0.5' }, seg) : React.createElement('span', { key: i }, seg);
      }));
    }
    return React.createElement(React.Fragment, null, content);
  }, [searchQuery, keywordHighlight, keywords]);

  return { searchQuery, setSearchQuery, searchMatches, currentMatch, nextMatch, prevMatch, keywordHighlight, setKeywordHighlight, renderContent };
}
