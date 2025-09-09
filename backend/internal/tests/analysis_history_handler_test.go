package tests

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
	"github.com/samusafe/genericapi/internal/models"
	"github.com/samusafe/genericapi/internal/utils"
)

type mockAnalysisRepo2 struct {
	latestFn       func(userID string, documentID int) (*models.AnalysisDetail, error)
	listAllFn      func(userID string, limit, offset int) ([]models.DocumentItem, int, error)
	updateDocColFn func(userID string, docID int, colID int) error
}

func (m *mockAnalysisRepo2) InsertDocument(string, *int, string, string, string) (int, error) {
	return 0, nil
}
func (m *mockAnalysisRepo2) InsertAnalysis(string, int, string, []string, string, []string, *string, *int) (int, error) {
	return 0, nil
}
func (m *mockAnalysisRepo2) FindDocument(string, *int, string) (int, error) { return 0, nil }
func (m *mockAnalysisRepo2) GetLatestAnalysisByDocument(userID string, documentID int) (*models.AnalysisDetail, error) {
	return m.latestFn(userID, documentID)
}
func (m *mockAnalysisRepo2) ListDocumentsByCollection(string, *int) ([]models.DocumentItem, error) {
	return nil, nil
}
func (m *mockAnalysisRepo2) ListAllDocuments(userID string, limit, offset int) ([]models.DocumentItem, int, error) {
	return m.listAllFn(userID, limit, offset)
}
func (m *mockAnalysisRepo2) UpdateDocumentCollection(userID string, docID int, colID int) error {
	return m.updateDocColFn(userID, docID, colID)
}

type mockCollectionsRepo2 struct {
	existsFn func(userID string, id int) (bool, error)
}

func (m *mockCollectionsRepo2) List(string) ([]models.Collection, error)          { return nil, nil }
func (m *mockCollectionsRepo2) Create(string, string) (*models.Collection, error) { return nil, nil }
func (m *mockCollectionsRepo2) Delete(string, int) error                          { return nil }
func (m *mockCollectionsRepo2) ExistsForUser(userID string, id int) (bool, error) {
	return m.existsFn(userID, id)
}

// shared test helpers
func newHistoryContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("lang", "en")
	c.Set("userID", "user-1")
	c.Set(utils.CorrelationIDHeader, "cid-test")
	return c, w
}

type envWrapper struct {
	Data          map[string]any `json:"data"`
	Message       string         `json:"message"`
	CorrelationID string         `json:"correlationId"`
}

func decodeEnv(t *testing.T, w *httptest.ResponseRecorder, out *envWrapper) {
	if err := json.Unmarshal(w.Body.Bytes(), out); err != nil {
		t.Fatalf("decode json: %v body=%s", err, w.Body.String())
	}
}

func TestAnalysisHistory_GetLatest_NotFound(t *testing.T) {
	aRepo := &mockAnalysisRepo2{latestFn: func(string, int) (*models.AnalysisDetail, error) { return nil, sql.ErrNoRows }}
	h := handlers.NewAnalysisHistoryHandler(aRepo, &mockCollectionsRepo2{})
	c, w := newHistoryContext()
	c.Params = gin.Params{{Key: "documentId", Value: "123"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/documents/123/latest-analysis", nil)
	h.GetLatestByDocument(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestAnalysisHistory_GetLatest_Success(t *testing.T) {
	detail := &models.AnalysisDetail{AnalysisID: 1, DocumentID: 10, FileName: "f.txt", Summary: "sum", Sentiment: "pos", Keywords: []string{"k"}, CreatedAt: "now", AnalysisVersion: 1, FullText: "full"}
	aRepo := &mockAnalysisRepo2{latestFn: func(string, int) (*models.AnalysisDetail, error) { return detail, nil }}
	h := handlers.NewAnalysisHistoryHandler(aRepo, &mockCollectionsRepo2{})
	c, w := newHistoryContext()
	c.Params = gin.Params{{Key: "documentId", Value: "10"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/documents/10/latest-analysis", nil)
	h.GetLatestByDocument(c)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", w.Code)
	}
	var env envWrapper
	decodeEnv(t, w, &env)
	if env.Data["analysis"] == nil {
		t.Fatalf("expected analysis in response")
	}
}

func TestAnalysisHistory_ListAll_Success(t *testing.T) {
	items := []models.DocumentItem{{ID: 1, FileName: "a"}, {ID: 2, FileName: "b"}}
	aRepo := &mockAnalysisRepo2{listAllFn: func(string, int, int) ([]models.DocumentItem, int, error) {
		return items, len(items), nil
	}}
	h := handlers.NewAnalysisHistoryHandler(aRepo, &mockCollectionsRepo2{})
	c, w := newHistoryContext()
	c.Request = httptest.NewRequest(http.MethodGet, "/documents?page=1&limit=10", nil)
	h.ListAllDocuments(c)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", w.Code)
	}
	var env envWrapper
	decodeEnv(t, w, &env)

	// Check if 'documents' key exists and is a map
	data, ok := env.Data["documents"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'documents' to be a map in the response data")
	}

	// Check total
	if total, ok := data["total"].(float64); !ok || total != 2 {
		t.Fatalf("expected total 2, got %v", data["total"])
	}
}

func TestAnalysisHistory_SaveDocumentToCollection_CollectionNotFound(t *testing.T) {
	aRepo := &mockAnalysisRepo2{updateDocColFn: func(string, int, int) error { return nil }}
	cRepo := &mockCollectionsRepo2{existsFn: func(string, int) (bool, error) { return false, nil }}
	h := handlers.NewAnalysisHistoryHandler(aRepo, cRepo)
	c, w := newHistoryContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/documents/save", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"documentId":1,"collectionId":99}`))
	h.SaveDocumentToCollection(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestAnalysisHistory_SaveDocumentToCollection_AlreadyAssigned(t *testing.T) {
	aRepo := &mockAnalysisRepo2{updateDocColFn: func(string, int, int) error { return errors.New("already_assigned") }}
	cRepo := &mockCollectionsRepo2{existsFn: func(string, int) (bool, error) { return true, nil }}
	h := handlers.NewAnalysisHistoryHandler(aRepo, cRepo)
	c, w := newHistoryContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/documents/save", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"documentId":2,"collectionId":3}`))
	h.SaveDocumentToCollection(c)
	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestAnalysisHistory_SaveDocumentToCollection_Success(t *testing.T) {
	aRepo := &mockAnalysisRepo2{updateDocColFn: func(string, int, int) error { return nil }}
	cRepo := &mockCollectionsRepo2{existsFn: func(string, int) (bool, error) { return true, nil }}
	h := handlers.NewAnalysisHistoryHandler(aRepo, cRepo)
	c, w := newHistoryContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/documents/save", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"documentId":5,"collectionId":6}`))
	h.SaveDocumentToCollection(c)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d body=%s", w.Code, w.Body.String())
	}
}
