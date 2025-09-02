package models

// AnalysisResponse represents the response structure for document analysis.
type AnalysisResponse struct {
	Summary       string   `json:"summary"`
	SummaryPoints []string `json:"summary_points"`
	Keywords      []string `json:"keywords"`
	Sentiment     string   `json:"sentiment"`
	FullText      string   `json:"fullText"`
}

// AnalysisResult holds the outcome of a single file analysis.
type AnalysisResult struct {
	FileName string            `json:"fileName"`
	Data     *AnalysisResponse `json:"data,omitempty"`
	Error    string            `json:"error,omitempty"`
	Reused   bool              `json:"reused,omitempty"`
}

// QuizQuestion represents a single question in a quiz.
type QuizQuestion struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

// QuizResponse represents the full quiz structure.
type QuizResponse struct {
	Quiz []QuizQuestion `json:"quiz"`
}

// AnalysisDetail contains fields used by latest-analysis endpoint.
type AnalysisDetail struct {
	AnalysisID      int      `json:"analysisId"`
	DocumentID      int      `json:"documentId"`
	FileName        string   `json:"fileName"`
	Summary         string   `json:"summary"`
	SummaryPoints   []string `json:"summaryPoints,omitempty"`
	Sentiment       string   `json:"sentiment"`
	Keywords        []string `json:"keywords"`
	CollectionID    *int     `json:"collectionId,omitempty"`
	CreatedAt       string   `json:"createdAt"`
	AnalysisVersion int      `json:"analysisVersion"`
	BatchID         *string  `json:"batchId,omitempty"`
	BatchSize       *int     `json:"batchSize,omitempty"`
	FullText        string   `json:"fullText"`
}

type DocumentItem struct {
	ID             int    `json:"id"`
	FileName       string `json:"fileName"`
	AnalysesCount  int    `json:"analysesCount"`
	LastAnalysisAt string `json:"lastAnalysisAt,omitempty"`
	CollectionID   *int   `json:"collectionId,omitempty"`
}
