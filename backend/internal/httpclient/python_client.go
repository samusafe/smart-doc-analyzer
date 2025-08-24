package httpclient

import (
	"bytes"
	"context"
	"errors"
	"mime/multipart"
	"net/http"
	"sync"
	"time"

	"github.com/samusafe/genericapi/internal/utils"
)

var (
	ErrPythonUnavailable = errors.New("python service unavailable")
	ErrBadStatus         = errors.New("python service returned bad status")
)

// PythonClient defines the contract for calling the Python microservice.
type PythonClient interface {
	AnalyzeWithCtx(ctx context.Context, file []byte, filename string, correlationID string) (*http.Response, error)
	GenerateQuizWithCtx(ctx context.Context, body []byte, correlationID string) (*http.Response, error)
}

type pythonClient struct {
	baseURL string
	client  *http.Client
}

var (
	clientOnce sync.Once
	singleton  *http.Client
)

// NewPythonClient returns a PythonClient with a shared *http.Client.
func NewPythonClient(baseURL string, timeout time.Duration) PythonClient {
	clientOnce.Do(func() {
		singleton = &http.Client{Timeout: timeout}
	})
	return &pythonClient{baseURL: baseURL, client: singleton}
}

func (p *pythonClient) AnalyzeWithCtx(ctx context.Context, file []byte, filename string, correlationID string) (*http.Response, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("file", filename)
	if err != nil {
		return nil, err
	}
	if _, err = part.Write(file); err != nil {
		return nil, err
	}
	if err = w.Close(); err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/analyze", &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	if correlationID != "" {
		req.Header.Set(utils.CorrelationIDHeader, correlationID)
	}
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, ErrPythonUnavailable
	}
	if resp.StatusCode != http.StatusOK {
		return resp, ErrBadStatus
	}
	return resp, nil
}

func (p *pythonClient) GenerateQuizWithCtx(ctx context.Context, body []byte, correlationID string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/generate-quiz", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if correlationID != "" {
		req.Header.Set(utils.CorrelationIDHeader, correlationID)
	}
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, ErrPythonUnavailable
	}
	if resp.StatusCode != http.StatusOK {
		return resp, ErrBadStatus
	}
	return resp, nil
}
