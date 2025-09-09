export interface AnalysisResult {
  fileName: string;
  data?: {
    summary: string;
    summaryPoints: string[];
    keywords: string[];
    sentiment: string;
    fullText: string;
  };
  error?: string;
  reused?: boolean;
  batchId?: string;
  batchSize?: number;
}

export interface AnalysisDetail {
  analysisId: number;
  documentId: number;
  fileName: string;
  summary: string;
  summaryPoints: string[];
  sentiment: string;
  keywords: string[];
  collectionId?: number;
  createdAt: string;
  batchId?: string;
  batchSize?: number;
  fullText: string;
}

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

export interface QuizQuestion {
  question: string;
  answer: string;
  options?: string[];
}

export interface QuizResponse {
  quiz: QuizQuestion[];
}

export interface Collection {
  id: number;
  name: string;
  documents: number;
  createdAt?: string;
}

export interface DocumentItem {
  id: number;
  fileName: string;
  analysesCount: number;
  lastAnalysisAt?: string;
  collectionId?: number;
}
