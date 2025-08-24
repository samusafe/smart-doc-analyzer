import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeDocuments, generateQuiz } from '@/api/analyze';
import { getLatestAnalysisByDocument } from '@/api/documentsLatest';
import { AnalysisResult, QuizQuestion, AnalysisDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFileQueue } from '@/hooks/useFileQueue';
import { useAppLanguage, useT } from '@/components/providers/AppProviders';

interface UseAnalysisManagerArgs {
  token?: string;
  activeCollection: string | null;
}

export function useAnalysisManager({ token, activeCollection }: UseAnalysisManagerArgs) {
  const { toast } = useToast();
  const { files, addFiles, replaceFiles, removeFile, clearFiles } = useFileQueue({ onWarn: (msg: string) => toast({ variant: msg.includes('limit') ? 'destructive' : 'warning', title: msg }) });
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('analysis.currentIndex.v1');
      return stored ? parseInt(stored) || 0 : 0;
    }
    return 0;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loadedDocNames, setLoadedDocNames] = useState<string[]>([]);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const lang = useAppLanguage();
  const t = useT();

  // Persist index
  useEffect(() => {
    try { localStorage.setItem('analysis.currentIndex.v1', String(currentAnalysisIndex)); } catch { /* ignore */ }
  }, [currentAnalysisIndex]);

  // Clamp index on results change or clear
  useEffect(() => {
    if (!analysisResults.length) {
      if (currentAnalysisIndex !== 0) setCurrentAnalysisIndex(0);
      return;
    }
    if (currentAnalysisIndex > analysisResults.length - 1) {
      setCurrentAnalysisIndex(0);
    }
  }, [analysisResults.length, currentAnalysisIndex]);

  // simple debounce hook (local to file to avoid new file overhead now)
  type AnyFunc = (...args: unknown[]) => void;
  function useDebouncedCallback<T extends AnyFunc>(fn: T, delay: number) {
    const timer = useRef<number | null>(null);
    return useCallback((...args: Parameters<T>) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fn(...args), delay);
    }, [fn, delay]);
  }

  const analyze = useCallback(async () => {
    if (!files.length) return;
    setIsLoading(true);
    setAnalysisResults([]);
    setShowQuiz(false);
    setLoadedDocNames([]);
    toast({ title: t('analysisStarted') });
    try {
      const data = await analyzeDocuments(files, { collectionId: activeCollection ? parseInt(activeCollection) : undefined, token, lang });
      setAnalysisResults(data);
      const reusedCount = data.filter(r => r.reused).length;
      if (reusedCount === data.length) {
        toast({ variant: 'success', title: t('loadedPreviousAnalyses'), description: `${reusedCount} file(s) reused (no reprocessing).` });
      } else if (reusedCount > 0) {
        toast({ variant: 'success', title: t('analysisComplete'), description: `${data.length - reusedCount} new · ${reusedCount} reused` });
      } else {
        toast({ variant: 'success', title: t('analysisCompleteExclaim') });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: t('analysisFailed'), description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [files, activeCollection, toast, token, lang, t]);

  const debouncedAnalyze = useDebouncedCallback(analyze, 300);

  const loadExistingDocuments = useCallback(async (docIds: number | number[]) => {
    const ids = Array.isArray(docIds) ? docIds : [docIds];
    if (!ids.length) return [] as AnalysisResult[];
    setIsLoading(true);
    setShowQuiz(false);
    try {
      const settled = await Promise.allSettled(ids.map(id => getLatestAnalysisByDocument(id, token, lang)));
      const successes: AnalysisDetail[] = [];
      const failures: { id: number; error: string }[] = [];
      settled.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          successes.push(res.value);
        } else {
          failures.push({ id: ids[idx], error: res.reason instanceof Error ? res.reason.message : 'Unknown error' });
        }
      });
      if (successes.length) {
        const mapped: AnalysisResult[] = successes.map(detail => ({
          fileName: detail.fileName,
          data: { summary: detail.summary, keywords: detail.keywords, sentiment: detail.sentiment, fullText: detail.fullText },
        }));
        const pseudoFiles: File[] = successes.map(d => new File([d.fullText || ''], d.fileName || 'document.txt', { type: 'text/plain' }));
        replaceFiles(pseudoFiles);
        setLoadedDocNames([]);
        setAnalysisResults(mapped);
        setCurrentAnalysisIndex(0);
        if (failures.length) {
          toast({ variant: 'warning', title: mapped.length === 1 ? t('loadedDocumentAnalysis') : t('analysisLoadedCount', { count: String(mapped.length) }), description: `${failures.length} failed` });
        } else {
          toast({ variant: 'success', title: mapped.length === 1 ? t('loadedDocumentAnalysis') : t('analysisLoadedCount', { count: String(mapped.length) }) });
        }
        return mapped;
      } else {
        toast({ variant: 'destructive', title: t('failedLoadDocumentsToast') });
        return [] as AnalysisResult[];
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, replaceFiles, lang, t]);

  const takeQuiz = useCallback(async () => {
    const currentResult = analysisResults[currentAnalysisIndex];
    if (!currentResult?.data?.fullText) return;
    setIsQuizLoading(true);
    toast({ title: t('generatingQuiz') });
    try {
      const data = await generateQuiz(currentResult.data.fullText, token, lang);
      setQuizQuestions(data.quiz);
      setShowQuiz(true);
      setQuizScore(null);
      setTimeout(() => quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast({ variant: 'success', title: t('quizReady') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('quizFailed'), description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsQuizLoading(false);
    }
  }, [analysisResults, currentAnalysisIndex, toast, token, lang, t]);

  const submitQuiz = useCallback((answers: string[]) => {
    const score = quizQuestions.reduce((acc, q, i) => acc + (q.answer === answers[i] ? 1 : 0), 0);
    setQuizScore(score);
    const percentage = Math.round((score / quizQuestions.length) * 100);
    toast({ variant: percentage >= 75 ? 'success' : 'warning', title: t('quizCompleted'), description: lang === 'pt' ? `Pontuação ${score}/${quizQuestions.length} (${percentage}%)` : `You scored ${score}/${quizQuestions.length} (${percentage}%)` });
  }, [quizQuestions, toast, lang, t]);

  const restartQuiz = useCallback(() => {
    setShowQuiz(false);
    setQuizScore(null);
    setQuizQuestions([]);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisResults([]);
    setQuizQuestions([]);
    setQuizScore(null);
    setShowQuiz(false);
    setCurrentAnalysisIndex(0);
    setLoadedDocNames([]);
  }, []);

  return {
    files,
    analysisResults,
    quizQuestions,
    currentAnalysisIndex,
    isLoading,
    isQuizLoading,
    quizScore,
    showQuiz,
    quizSectionRef,
    setCurrentAnalysisIndex,
    addFiles,
    removeFile,
    clearFiles,
    analyze,
    debouncedAnalyze,
    loadExistingDocuments,
    takeQuiz,
    submitQuiz,
    restartQuiz,
    clearAnalysis,
    loadedDocNames,
  };
}
