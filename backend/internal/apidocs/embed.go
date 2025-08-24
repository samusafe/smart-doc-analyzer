package apidocs

import _ "embed"

//go:embed spec/openapi.yaml
var Spec []byte
