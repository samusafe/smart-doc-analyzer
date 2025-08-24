import { AnalysisResult } from '@/lib/types';

export type AnalyzedItem = {
  id?: number;
  fileName: string;
  status: 'pending' | 'analyzed' | 'error' | 'reused';
  analysis?: AnalysisResult['data'];
  reused?: boolean;
  batchId?: string;
  batchSize?: number;
  error?: string;
};

export function mapResultToItem(r: AnalysisResult): AnalyzedItem {
  return {
    fileName: r.fileName,
    status: r.error ? 'error' : r.reused ? 'reused' : 'analyzed',
    analysis: r.data,
    reused: r.reused,
    batchId: r.batchId,
    batchSize: r.batchSize,
    error: r.error,
  };
}
