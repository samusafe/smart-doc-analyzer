import { AnalysisResult, QuizResponse } from "@/lib/types";
import { Api } from "@/lib/apiClient";

export async function analyzeDocuments(
  files: File[],
  opts: { collectionId?: number; token?: string; lang?: string } = {}
): Promise<AnalysisResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("documents", file));
  if (opts.collectionId !== undefined) formData.append("collectionId", String(opts.collectionId));
  const { payload } = await Api.analyze(formData, { token: opts.token, lang: opts.lang });
  return (payload.results || []) as AnalysisResult[];
}

export async function generateQuiz(text: string, token?: string, lang?: string): Promise<QuizResponse> {
  const { payload } = await Api.generateQuiz(text, { token, lang });
  return payload as QuizResponse;
}
