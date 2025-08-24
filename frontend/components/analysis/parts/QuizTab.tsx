import React from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/components/providers/AppProviders';

interface QuizTabProps { takeQuiz: () => Promise<void>; isQuizLoading: boolean; hasText: boolean; }
export const QuizTab: React.FC<QuizTabProps> = ({ takeQuiz, isQuizLoading, hasText }) => {
  const t = useT();
  return (
    <div className="space-y-4 text-slate-300 max-w-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">{t('quiz')}</p>
      <p className="text-xs opacity-70">{t('quizInstructions') || 'Generate a quiz based on the analyzed text to test your knowledge.'}</p>
      <Button size="sm" onClick={takeQuiz} disabled={isQuizLoading || !hasText}>{isQuizLoading ? t('preparingQuiz') : t('takeQuiz')}</Button>
      {!hasText && <p className="text-[11px] text-slate-500">{t('noTextSections') || 'No text available to display.'}</p>}
    </div>
  );
};
