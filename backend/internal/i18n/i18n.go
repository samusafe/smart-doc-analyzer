package i18n

import (
	"embed"
	"encoding/json"
	"io/fs"
	"strings"

	"github.com/samusafe/genericapi/internal/logging"
)

//go:embed locales/*.json
var localesFS embed.FS

var messages = make(map[string]map[string]string)

func Init() {
	err := fs.WalkDir(localesFS, "locales", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".json") {
			lang := strings.TrimSuffix(d.Name(), ".json")
			file, err := localesFS.Open(path)
			if err != nil {
				logging.Logger.Error().Err(err).Str("file", path).Msg("Failed to open message file")
				return err
			}
			defer file.Close()

			var msgs map[string]string
			if err := json.NewDecoder(file).Decode(&msgs); err != nil {
				logging.Logger.Error().Err(err).Str("file", path).Msg("Failed to decode message file")
				return err
			}
			messages[lang] = msgs
			logging.Logger.Info().Str("language", lang).Msg("Loaded language messages")
		}
		return nil
	})
	if err != nil {
		logging.Logger.Fatal().Err(err).Msg("Failed to walk message files")
	}
}

// GetMessage retrieves a message for a given language and key.
func GetMessage(lang, key string) string {
	if msgs, ok := messages[lang]; ok {
		if msg, ok := msgs[key]; ok {
			return msg
		}
	}
	// Fallback to English
	if msgs, ok := messages["en"]; ok {
		if msg, ok := msgs[key]; ok {
			return msg
		}
	}
	return key // return key if no message found
}
