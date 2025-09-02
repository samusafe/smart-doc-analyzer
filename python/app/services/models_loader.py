import os
import torch
from transformers import pipeline
from keybert import KeyBERT

try:
    from transformers import T5Tokenizer, T5ForConditionalGeneration
except Exception:  # pragma: no cover
    T5Tokenizer = T5ForConditionalGeneration = None  # type: ignore

# --- Model Configuration from Environment Variables ---
SUMMARIZER_MODEL_NAME = os.getenv("SUMMARIZER_MODEL", "facebook/bart-large-cnn")
KEYBERT_MODEL_NAME = os.getenv("KEYBERT_MODEL", "all-MiniLM-L6-v2")
QG_MODEL_NAME = os.getenv("QG_MODEL", "valhalla/t5-base-qg-hl")


# Global holders
_SUMMARIZER = None
_QA_PIPELINE = None
_KEYBERT_MODEL = None


def load_models():
    """Idempotent loader for heavy models. Called at startup."""
    global _SUMMARIZER, _QA_PIPELINE, _KEYBERT_MODEL

    if _SUMMARIZER is None:
        try:
            print(f"📝 Loading summarization model: {SUMMARIZER_MODEL_NAME}...")
            device = 0 if torch.cuda.is_available() else -1
            _SUMMARIZER = pipeline("summarization", model=SUMMARIZER_MODEL_NAME, device=device)
            print("✅ Summarization model loaded.")
        except Exception as e:  # pragma: no cover
            print(f"❌ Summarization model load failed: {e}")
            _SUMMARIZER = None
    
    if _KEYBERT_MODEL is None:
        try:
            print(f"🔑 Loading KeyBERT model: {KEYBERT_MODEL_NAME}...")
            # Using a smaller, efficient model for keyword extraction
            _KEYBERT_MODEL = KeyBERT(model=KEYBERT_MODEL_NAME)
            print("✅ KeyBERT model loaded.")
        except Exception as e: # pragma: no cover
            print(f"❌ KeyBERT model load failed: {e}")
            _KEYBERT_MODEL = None

    if _QA_PIPELINE is None:
        if T5Tokenizer and T5ForConditionalGeneration:
            try:
                print(f"🧠 Loading Question Generation model: {QG_MODEL_NAME}...")
                device = 0 if torch.cuda.is_available() else -1
                tokenizer = T5Tokenizer.from_pretrained(QG_MODEL_NAME, legacy=False)
                model = T5ForConditionalGeneration.from_pretrained(QG_MODEL_NAME)
                _QA_PIPELINE = pipeline("text2text-generation", model=model, tokenizer=tokenizer, device=device)
                print("✅ QG model loaded.")
            except Exception as e:  # pragma: no cover
                print(f"❌ QG model load failed: {e}")
        else:
            print("⚠️ Transformers QG dependencies missing; skipping quiz model.")


def get_summarizer():
    return _SUMMARIZER

def get_keybert_model():
    return _KEYBERT_MODEL

def get_qa_pipeline():
    return _QA_PIPELINE
