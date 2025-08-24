import React, { useState } from 'react';
import { AnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useT } from '@/components/providers/AppProviders';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/AlertDialog';
import { useTextSections } from '@/hooks/useTextSections';
import { useSearchAndHighlight } from '@/hooks/useSearchAndHighlight';
import { useNotes } from '@/hooks/useNotes';
import { FileSelectorBar } from '@/components/analysis/parts/FileSelectorBar';
import { TabsBar } from '@/components/analysis/parts/TabsBar';
import { SummaryTab } from '@/components/analysis/parts/SummaryTab';
import { TextTab } from '@/components/analysis/parts/TextTab';
import { NotesTab } from '@/components/analysis/parts/NotesTab';
import { KeywordsTab } from '@/components/analysis/parts/KeywordsTab';
import { StatsTab } from '@/components/analysis/parts/StatsTab';
import { QuizTab } from '@/components/analysis/parts/QuizTab';
import { FileText, NotebookPen, Type, ListChecks, BarChart3, StickyNote } from 'lucide-react';
import { ExportMenu } from '@/components/analysis/parts/ExportMenu';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';
import { usePersistentTab } from '@/hooks/usePersistentTab';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResultViewerProps {
  results: AnalysisResult[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  clearAnalysis: () => void;
  takeQuiz: () => Promise<void>;
  isQuizLoading: boolean;
}

export const AnalysisResultViewer: React.FC<AnalysisResultViewerProps> = ({ results, currentIndex, setCurrentIndex, clearAnalysis, takeQuiz, isQuizLoading }) => {
  const t = useT();
  const { toast } = useToast();
  const tabs = [
    { id: 'summary', label: t('summary'), icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'text', label: t('fullText'), icon: <Type className="h-3.5 w-3.5" /> },
    { id: 'keywords', label: t('keywords'), icon: <ListChecks className="h-3.5 w-3.5" /> },
    { id: 'quiz', label: t('quiz'), icon: <NotebookPen className="h-3.5 w-3.5" /> },
    { id: 'stats', label: t('statistics'), icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'notes', label: t('notes'), icon: <StickyNote className="h-3.5 w-3.5" /> },
  ];
  const [activeTab, setActiveTab] = usePersistentTab(STORAGE_KEYS.activeTab, 'summary');
  const [exportHandlers, setExportHandlers] = useState<{ exportDocx: () => Promise<void>; exportPdf: () => Promise<void>; } | null>(null);
  const [notesExportHandlers, setNotesExportHandlers] = useState<{ exportNotesDocx: () => Promise<void>; exportNotesPdf: () => Promise<void>; } | null>(null);
  const { step: onboardingStep, next: advanceOnboarding, skip: skipOnboarding } = useOnboarding(STORAGE_KEYS.onboarding, 3);

  const current = results[currentIndex];
  const data = current?.data;
  const { textSections, contentScrollRef, activeSection, scrollTo } = useTextSections(data?.fullText);
  const { searchQuery, setSearchQuery, searchMatches, nextMatch, prevMatch, keywordHighlight, setKeywordHighlight, renderContent } = useSearchAndHighlight(data?.fullText, data?.keywords);
  const { notes, newNoteDrafts, setNewNoteDrafts, editingNoteId, editingDraft, setEditingDraft, setEditingNoteId, addNote, saveEditNote, deleteNote, sectionNotes } = useNotes(current?.fileName, data?.fullText);

  const handleSummaryExports = React.useCallback((h: { exportDocx: () => Promise<void>; exportPdf: () => Promise<void>; }) => {
    setExportHandlers({
      exportDocx: async () => {
        try { await h.exportDocx(); toast({ variant: 'success', title: t('exportSuccess') }); }
        catch (e) { toast({ variant: 'destructive', title: t('exportFailed'), description: e instanceof Error ? e.message : String(e) }); }
      },
      exportPdf: async () => {
        try { await h.exportPdf(); toast({ variant: 'success', title: t('exportSuccess') }); }
        catch (e) { toast({ variant: 'destructive', title: t('exportFailed'), description: e instanceof Error ? e.message : String(e) }); }
      }
    });
  }, [t, toast]);

  const handleNotesExports = React.useCallback((h: { exportNotesDocx: () => Promise<void>; exportNotesPdf: () => Promise<void>; }) => {
    setNotesExportHandlers({
      exportNotesDocx: async () => {
        try { await h.exportNotesDocx(); toast({ variant: 'success', title: t('exportSuccess') }); }
        catch (e) { toast({ variant: 'destructive', title: t('exportFailed'), description: e instanceof Error ? e.message : String(e) }); }
      },
      exportNotesPdf: async () => {
        try { await h.exportNotesPdf(); toast({ variant: 'success', title: t('exportSuccess') }); }
        catch (e) { toast({ variant: 'destructive', title: t('exportFailed'), description: e instanceof Error ? e.message : String(e) }); }
      }
    });
  }, [t, toast]);

  if (!results.length) return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-900/60 to-slate-900 shadow-inner p-6 items-center justify-center text-sm text-slate-400">
      {t('noAnalysis')}
    </div>
  );

  return (
    <div className="relative flex flex-col h-full rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-900/60 to-slate-900 shadow-inner overflow-hidden">
      {/* Onboarding overlay */}
      {onboardingStep > -1 && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-end p-4 md:p-6">
          <div className="pointer-events-auto max-w-sm w-full bg-slate-900/95 border border-slate-700/70 rounded-lg shadow-lg p-4 space-y-3 text-[12px] animate-fade-in">
            <p className="font-semibold text-slate-100">
              {onboardingStep === 0 && t('onboardStepTabsTitle')}
              {onboardingStep === 1 && t('onboardStepTextTitle')}
              {onboardingStep === 2 && t('onboardStepNotesTitle')}
            </p>
            <p className="text-slate-300 leading-relaxed">
              {onboardingStep === 0 && (t('onboardStepTabsBody'))}
              {onboardingStep === 1 && (t('onboardStepTextBody'))}
              {onboardingStep === 2 && (t('onboardStepNotesBody'))}
            </p>
            <div className="flex justify-between gap-2 pt-1">
              <button onClick={skipOnboarding} className="px-2 py-1 rounded text-[11px] bg-slate-700/60 hover:bg-slate-600 text-slate-200">{t('skip')}</button>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 pr-1">
                  {[0,1,2].map(i => <span key={i} className={`h-1.5 w-1.5 rounded-full ${onboardingStep === i ? 'bg-indigo-400' : 'bg-slate-600'}`} />)}
                </div>
                <button onClick={advanceOnboarding} className="px-3 py-1 rounded text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  {onboardingStep === 2 ? (t('finish')) : (t('next'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <FileSelectorBar results={results} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
      <div className="flex items-center justify-between px-4 pt-2 text-[11px] text-slate-300">
        <span>{t('document')} {currentIndex + 1} {t('of')} {results.length}</span>
        <div className="flex items-center gap-3">
          {activeTab === 'text' && <span className="hidden md:inline" aria-live="polite">{textSections.length} {t('sections')}</span>}
          {activeTab === 'summary' && exportHandlers && (
            <ExportMenu
              items={[
                { key: 'docx', label: t('exportWord'), onClick: exportHandlers.exportDocx },
                { key: 'pdf', label: t('exportPdf'), onClick: exportHandlers.exportPdf }
              ]}
              buttonLabel={t('export')}
            />
          )}
          {activeTab === 'notes' && notesExportHandlers && (
            <ExportMenu
              items={[
                { key: 'docx-notes', label: t('exportWord'), onClick: notesExportHandlers.exportNotesDocx },
                { key: 'pdf-notes', label: t('exportPdf'), onClick: notesExportHandlers.exportNotesPdf }
              ]}
              buttonLabel={t('export')}
            />
          )}
        </div>
      </div>
      <TabsBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div key={activeTab} className="flex-1 overflow-auto p-6 text-sm animate-fade-in" id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}> 
        {activeTab === 'summary' && current && <SummaryTab current={current} onGetExports={handleSummaryExports} />}
        {activeTab === 'text' && (
          <TextTab
            textSections={textSections}
            activeSection={activeSection}
            scrollTo={scrollTo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchMatches={searchMatches}
            nextMatch={nextMatch}
            prevMatch={prevMatch}
            keywordHighlight={keywordHighlight}
            setKeywordHighlight={setKeywordHighlight}
            notes={notes}
            sectionNotes={sectionNotes}
            newNoteDrafts={newNoteDrafts}
            setNewNoteDrafts={setNewNoteDrafts}
            addNote={addNote}
            editingNoteId={editingNoteId}
            editingDraft={editingDraft}
            setEditingDraft={setEditingDraft}
            setEditingNoteId={setEditingNoteId}
            saveEditNote={saveEditNote}
            deleteNote={deleteNote}
            contentScrollRef={contentScrollRef as React.RefObject<HTMLDivElement>}
            renderContent={renderContent}
            openNotesTab={() => setActiveTab('notes')}
          />
        )}
        {activeTab === 'keywords' && (
          <KeywordsTab keywords={data?.keywords} />
        )}
        {activeTab === 'quiz' && (
          <React.Suspense fallback={<div className="text-xs text-slate-400" aria-busy>{t('loading')}</div>}>
            <QuizTab takeQuiz={takeQuiz} isQuizLoading={isQuizLoading} hasText={!!data?.fullText} />
          </React.Suspense>
        )}
        {activeTab === 'stats' && (
          <React.Suspense fallback={<div className="text-xs text-slate-400" aria-busy>{t('loading')}</div>}>
            <StatsTab fullText={data?.fullText} keywordsCount={data?.keywords?.length || 0} />
          </React.Suspense>
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
            textSections={textSections}
            setActiveTab={setActiveTab}
            setEditingNoteId={setEditingNoteId}
            setEditingDraft={setEditingDraft}
            deleteNote={deleteNote}
            editingDraft={editingDraft}
            onGetExports={handleNotesExports}
          />
        )}
      </div>
      <div className="p-4 border-t border-slate-700/60 flex items-center justify-between">
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost">{t('clearAnalysis')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 text-slate-200 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">{t('confirmClearTitle')}</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">{t('confirmClearDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700/50 text-slate-200 hover:bg-slate-600 border-slate-600">{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-500 text-white" onClick={clearAnalysis}>{t('confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
