package utils

var Messages = map[string]map[string]string{
	"en": {
		"InvalidRequest":              "Invalid request. Please check your input.",
		"InternalError":               "An internal error occurred. Please try again later.",
		"Unauthorized":                "Unauthorized",
		"NotFound":                    "Resource not found",
		"TooManyRequests":             "Too many requests",
		"UnsupportedFileType":         "Unsupported file type. Please upload a valid document.",
		"FileLimitExceeded":           "You can upload a maximum of 10 files at a time.",
		"PythonServiceUnavailable":    "Unable to contact the analysis service. Please try again later.",
		"CollectionCreated":           "Collection created successfully.",
		"CollectionDeleted":           "Collection deleted successfully.",
		"CollectionExists":            "A collection with that name already exists.",
		"CollectionInvalidName":       "Invalid collection name.",
		"DocumentAlreadyInCollection": "Document is already in this collection.",
		"DocumentDuplicate":           "Duplicate document in the target collection.",
		"DocumentSaved":               "Document added to collection.",
	},
	"pt": {
		"InvalidRequest":              "Pedido inválido",
		"InternalError":               "Erro interno do servidor",
		"Unauthorized":                "Não autorizado",
		"NotFound":                    "Recurso não encontrado",
		"TooManyRequests":             "Muitos pedidos",
		"UnsupportedFileType":         "Tipo de ficheiro não suportado",
		"PythonServiceUnavailable":    "Não foi possível contactar o serviço de análise. Tente novamente mais tarde.",
		"CollectionCreated":           "Coleção criada com sucesso.",
		"CollectionDeleted":           "Coleção removida com sucesso.",
		"CollectionExists":            "Já existe uma coleção com esse nome.",
		"CollectionInvalidName":       "Nome de coleção inválido.",
		"DocumentAlreadyInCollection": "Documento já está nesta coleção.",
		"DocumentDuplicate":           "Documento duplicado na coleção de destino.",
		"DocumentSaved":               "Documento adicionado à coleção.",
	},
}

func GetMessage(lang, key string) string {
	if msgs, ok := Messages[lang]; ok {
		if msg, ok := msgs[key]; ok {
			return msg
		}
	}
	return Messages["en"][key]
}
