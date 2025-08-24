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

type mockCollectionsRepo struct {
	listFn          func(userID string) ([]models.Collection, error)
	createFn        func(userID, name string) (*models.Collection, error)
	deleteFn        func(userID string, id int) error
	existsForUserFn func(userID string, id int) (bool, error)
}

func (m *mockCollectionsRepo) List(userID string) ([]models.Collection, error) {
	return m.listFn(userID)
}
func (m *mockCollectionsRepo) Create(userID, name string) (*models.Collection, error) {
	return m.createFn(userID, name)
}
func (m *mockCollectionsRepo) Delete(userID string, id int) error { return m.deleteFn(userID, id) }
func (m *mockCollectionsRepo) ExistsForUser(userID string, id int) (bool, error) {
	return m.existsForUserFn(userID, id)
}

type mockAnalysisRepo struct {
	listDocsByColFn func(userID string, collectionID *int) ([]models.DocumentItem, error)
}

func (m *mockAnalysisRepo) InsertDocument(string, *int, string, string, string) (int, error) {
	return 0, nil
}
func (m *mockAnalysisRepo) InsertAnalysis(string, int, string, []string, string, *string, *int) (int, error) {
	return 0, nil
}
func (m *mockAnalysisRepo) FindDocument(string, *int, string) (int, error) { return 0, nil }
func (m *mockAnalysisRepo) GetLatestAnalysisByDocument(string, int) (*models.AnalysisDetail, error) {
	return nil, errors.New("not implemented")
}
func (m *mockAnalysisRepo) ListDocumentsByCollection(userID string, collectionID *int) ([]models.DocumentItem, error) {
	return m.listDocsByColFn(userID, collectionID)
}
func (m *mockAnalysisRepo) ListAllDocuments(string) ([]models.DocumentItem, error) { return nil, nil }
func (m *mockAnalysisRepo) UpdateDocumentCollection(string, int, int) error        { return nil }

// helper to create gin context
func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("lang", "en")
	c.Set("userID", "user-1")
	c.Set(utils.CorrelationIDHeader, "cid-test")
	return c, w
}

type envelope struct {
	Data          map[string]any `json:"data"`
	Message       string         `json:"message"`
	CorrelationID string         `json:"correlationId"`
}

func decodeEnvelope(t *testing.T, w *httptest.ResponseRecorder, out *envelope) {
	if err := json.Unmarshal(w.Body.Bytes(), out); err != nil {
		t.Fatalf("decode json: %v body=%s", err, w.Body.String())
	}
}

func TestCollectionsHandler_Create_Success(t *testing.T) {
	repo := &mockCollectionsRepo{createFn: func(userID, name string) (*models.Collection, error) {
		return &models.Collection{ID: 1, UserID: userID, Name: name}, nil
	}, listFn: nil, deleteFn: nil, existsForUserFn: nil}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/collections", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{}
	c.Set("lang", "en")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"name":"My Coll"}`))

	h.Create(c)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 got %d body=%s", w.Code, w.Body.String())
	}
	var env envelope
	decodeEnvelope(t, w, &env)
	if env.Data["collection"] == nil {
		t.Fatalf("expected collection in response: %+v", env)
	}
}

func TestCollectionsHandler_Create_Duplicate(t *testing.T) {
	repo := &mockCollectionsRepo{createFn: func(_, _ string) (*models.Collection, error) { return nil, errors.New("exists") }}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/collections", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"name":"Dup"}`))
	h.Create(c)
	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCollectionsHandler_Create_Invalid(t *testing.T) {
	repo := &mockCollectionsRepo{createFn: func(_, _ string) (*models.Collection, error) { return nil, errors.New("invalid") }}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Request = httptest.NewRequest(http.MethodPost, "/collections", nil)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Body = io.NopCloser(strings.NewReader(`{"name":"   "}`))
	h.Create(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCollectionsHandler_Delete_NotFound(t *testing.T) {
	repo := &mockCollectionsRepo{deleteFn: func(string, int) error { return sql.ErrNoRows }}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Params = gin.Params{{Key: "id", Value: "123"}}
	c.Request = httptest.NewRequest(http.MethodDelete, "/collections/123", nil)
	h.Delete(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCollectionsHandler_Delete_Success(t *testing.T) {
	repo := &mockCollectionsRepo{deleteFn: func(string, int) error { return nil }}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Params = gin.Params{{Key: "id", Value: "55"}}
	c.Request = httptest.NewRequest(http.MethodDelete, "/collections/55", nil)
	h.Delete(c)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCollectionsHandler_ListDocuments_NotFound(t *testing.T) {
	repo := &mockCollectionsRepo{existsForUserFn: func(string, int) (bool, error) { return false, nil }}
	h := handlers.NewCollectionsHandler(repo, &mockAnalysisRepo{})
	c, w := newTestContext()
	c.Params = gin.Params{{Key: "id", Value: "9"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/collections/9/documents", nil)
	h.ListDocuments(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCollectionsHandler_ListDocuments_Success(t *testing.T) {
	repo := &mockCollectionsRepo{existsForUserFn: func(string, int) (bool, error) { return true, nil }}
	analysisRepo := &mockAnalysisRepo{listDocsByColFn: func(userID string, collectionID *int) ([]models.DocumentItem, error) {
		return []models.DocumentItem{{ID: 1, FileName: "a.txt"}, {ID: 2, FileName: "b.txt"}}, nil
	}}
	h := handlers.NewCollectionsHandler(repo, analysisRepo)
	c, w := newTestContext()
	c.Params = gin.Params{{Key: "id", Value: "7"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/collections/7/documents?limit=1", nil)
	h.ListDocuments(c)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d body=%s", w.Code, w.Body.String())
	}
	var env envelope
	decodeEnvelope(t, w, &env)
	itemsRaw, ok := env.Data["items"].([]any)
	if !ok || len(itemsRaw) != 1 {
		t.Fatalf("expected paginated 1 item, got %#v", env.Data["items"])
	}
}
