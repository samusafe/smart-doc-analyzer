"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LibrarySidebar } from "./LibrarySidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null, name?: string | null) => void;
  token?: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function LibraryDrawer({ activeCollectionId, onSelectCollection, token, open, setOpen }: Props) {
  const width = 340;
  const topOffset = 56;
  return (
    <div className="fixed left-0 z-40" style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}>
      <div className="h-full">
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside
              key="drawer"
              initial={{ x: -width + 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -width + 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full flex flex-col bg-gradient-to-b from-slate-900/40 via-slate-900 to-slate-900 backdrop-blur border-r border-slate-700 shadow-sm relative"
              style={{ width }}
            >
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <LibrarySidebar activeCollectionId={activeCollectionId} onSelectCollection={onSelectCollection} token={token} />
              </div>
              <button aria-label="Collapse library" onClick={() => setOpen(false)} className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-full border border-slate-700 bg-slate-800 shadow hover:bg-slate-700 hover:text-indigo-300 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
        {!open && (
          <button aria-label="Expand library" aria-expanded={open} onClick={() => setOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-r-full rounded-l-none border border-l-0 border-slate-700 bg-slate-800 shadow hover:bg-slate-700 hover:text-indigo-300 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
