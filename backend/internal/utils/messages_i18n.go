package utils

var Messages = map[string]map[string]string{
	"en": {
		"InvalidRequest":  "Invalid request",
		"InternalError":   "Internal server error",
		"Unauthorized":    "Unauthorized",
		"NotFound":        "Resource not found",
		"TooManyRequests": "Too many requests",
	},
	"pt": {
		"InvalidRequest":  "Pedido inválido",
		"InternalError":   "Erro interno do servidor",
		"Unauthorized":    "Não autorizado",
		"NotFound":        "Recurso não encontrado",
		"TooManyRequests": "Muitos pedidos",
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
