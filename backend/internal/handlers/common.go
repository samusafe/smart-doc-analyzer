package handlers

import (
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/utils"
)

// ==== Path / Query Parsing Helpers ====

// parsePositiveIntParam parses a positive int path parameter.
func parsePositiveIntParam(c *gin.Context, name string) (int, bool) {
	val, err := strconv.Atoi(c.Param(name))
	if err != nil || val <= 0 {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", name)
		return 0, false
	}
	return val, true
}

// paginateSlice applies limit/offset to a slice length returning safe bounds.
func paginateSlice(total, defaultLimit int, c *gin.Context) (start, end int) {
	limit := defaultLimit
	offset := 0
	if v := c.Query("limit"); v != "" {
		if iv, e := strconv.Atoi(v); e == nil && iv > 0 && iv <= 200 {
			limit = iv
		}
	}
	if v := c.Query("offset"); v != "" {
		if iv, e := strconv.Atoi(v); e == nil && iv >= 0 {
			offset = iv
		}
	}
	if offset > total {
		offset = total
	}
	end = min(offset+limit, total)
	return offset, end
}

// parseCollectionIDForm optional form field.
func parseCollectionIDForm(c *gin.Context, field string) *int {
	if raw := c.PostForm(field); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil {
			return &v
		}
	}
	return nil
}

// ==== Upload Validation ====

// validateUploadedFiles basic validations.
func validateUploadedFiles(c *gin.Context, formKey string, max int) ([]*multipart.FileHeader, bool) {
	form, err := c.MultipartForm()
	if err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", err.Error())
		return nil, false
	}
	files := form.File[formKey]
	if len(files) == 0 {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", "no files provided")
		return nil, false
	}
	if len(files) > max {
		utils.GinError(c, http.StatusBadRequest, "FileLimitExceeded", nil)
		return nil, false
	}
	return files, true
}
