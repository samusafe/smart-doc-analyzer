import { AnalysisDetail } from "@/lib/types";
import { Api } from "@/lib/apiClient";

export async function getLatestAnalysisByDocument(documentId: number, token?: string, lang?: string): Promise<AnalysisDetail> {
  const { payload } = await Api.latestAnalysis(documentId, { token, lang });
  return payload.analysis as AnalysisDetail;
}
