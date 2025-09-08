"use client";

import { motion } from 'framer-motion';
import { useAuthToken } from '../providers/AppProviders';
import { useState } from 'react';
import { LibraryDrawer } from '../library/LibraryDrawer';
import { ExplorerGrid } from '../library/ExplorerGrid';
import { useToast } from '@/hooks/use-toast';
import { FileUploadPanel } from './FileUploadPanel';
import { AnalysisResultViewer } from './AnalysisResultViewer';
import { useAnalysisManager } from '../../hooks/useAnalysisManager';

export default function FileAnalyzer() {
  const token = useAuthToken();
  const { toast } = useToast();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    files,
    analysisResults,
    currentAnalysisIndex,
    isLoading,
    isQuizLoading,
    showQuiz,
    quizSectionRef,
    setCurrentAnalysisIndex,
    addFiles,
    removeFile,
    clearFiles,
    analyze,
    loadExistingDocuments,
    takeQuiz,
    clearAnalysis,
    loadedDocNames,
  } = useAnalysisManager({ token, activeCollection });

  return (
    <div className="relative">
      <motion.div
        animate={{ paddingLeft: drawerOpen ? 340 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="duration-300"
      >
        <div className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gradient">Document Analyzer & Study Tool</h1>
              <p className="text-muted-foreground">Upload, analyze, and test your knowledge.</p>
            </header>
            <div className="flex items-center justify-end mb-2 gap-2">
            </div>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start min-h-[520px]">
              <div className="h-full">
                <div className="h-[520px] flex flex-col">
                  <FileUploadPanel
                    files={files}
                    addFiles={addFiles}
                    removeFile={removeFile}
                    clearFiles={clearFiles}
                    analyze={analyze}
                    isLoading={isLoading}
                    loadedDocNames={loadedDocNames}
                  />
                </div>
              </div>
              <div className="h-full">
                <AnalysisResultViewer
                  results={analysisResults}
                  currentIndex={currentAnalysisIndex}
                  setCurrentIndex={setCurrentAnalysisIndex}
                  clearAnalysis={clearAnalysis}
                  takeQuiz={takeQuiz}
                  isQuizLoading={isQuizLoading}
                />
              </div>
            </main>
            <div className="mt-8">
              <ExplorerGrid
                onSelectDocument={async (docId) => {
                  try {
                    await loadExistingDocuments(docId);
                  } catch (e) {
                    toast({ variant: 'destructive', title: 'Failed to load document', description: e instanceof Error ? e.message : 'Unknown' });
                  }
                }}
              />
            </div>
            {showQuiz && (
              <div ref={quizSectionRef} className="mt-12">
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <LibraryDrawer
        activeCollectionId={activeCollection}
        onSelectCollection={(id) => { setActiveCollection(id); }}
        token={token}
        open={drawerOpen}
        setOpen={setDrawerOpen}
      />
    </div>
  );
}
