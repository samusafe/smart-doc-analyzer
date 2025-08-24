export interface AnalysisResult {
  fileName: string;
  data?: {
    summary: string;
    keywords: string[];
    sentiment: string;
    fullText: string;
  };
  error?: string;
  reused?: boolean;
  batchId?: string;
  batchSize?: number;
}

export interface QuizQuestion {
  question: string;
  answer: string;
  options?: string[];
}

export interface QuizResponse {
  quiz: QuizQuestion[];
}

// Minimal detail type for latest-analysis endpoint
export interface AnalysisDetail {
  analysisId: number;
  documentId: number;
  fileName: string;
  summary: string;
  sentiment: string;
  keywords: string[];
  collectionId?: number;
  createdAt: string;
  batchId?: string;
  batchSize?: number;
  fullText: string;
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
