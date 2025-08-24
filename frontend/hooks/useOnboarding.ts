import { useState } from 'react';

export function useOnboarding(storageKey: string, totalSteps: number) {
  const [step, setStep] = useState<number>(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(storageKey)) return 0;
    return -1;
  });
  const finish = () => { try { localStorage.setItem(storageKey, '1'); } catch {}; setStep(-1); };
  const next = () => setStep(s => (s >= totalSteps - 1 ? (finish(), -1) : s + 1));
  const skip = () => finish();
  return { step, next, skip, finish };
}
