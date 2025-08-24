import os
import re
import torch
import spacy
from transformers import pipeline
from rake_nltk import Rake
from typing import Optional

try:
    from transformers import T5Tokenizer, T5ForConditionalGeneration
except Exception:  # pragma: no cover
    T5Tokenizer = T5ForConditionalGeneration = None  # type: ignore

# Global holders
_NLP = None
_RAKE: Optional[Rake] = None
_SUMMARIZER = None
_QA_PIPELINE = None


def load_models():
    """Idempotent loader for heavy models. Called at startup."""
    global _NLP, _RAKE, _SUMMARIZER, _QA_PIPELINE

    if _NLP is None:
        try:
            print("📚 Loading spaCy model...")
            _NLP = spacy.load("en_core_web_sm")
            _RAKE = Rake()
            print("✅ spaCy model loaded.")
        except Exception as e:  # pragma: no cover
            print(f"❌ spaCy load failed: {e}")
            _NLP = None
            _RAKE = None

    if _SUMMARIZER is None:
        try:
            print("📝 Loading summarization model...")
            device = 0 if torch.cuda.is_available() else -1
            _SUMMARIZER = pipeline("summarization", model="facebook/bart-large-cnn", device=device)
            print("✅ Summarization model loaded.")
        except Exception as e:  # pragma: no cover
            print(f"❌ Summarization model load failed: {e}")
            _SUMMARIZER = None

    if _QA_PIPELINE is None and os.getenv("ENABLE_QUIZ", "1") not in ("0", "false", "False"):
        if T5Tokenizer and T5ForConditionalGeneration:
            try:
                print("🧠 Loading Question Generation model...")
                device = 0 if torch.cuda.is_available() else -1
                model_name = "valhalla/t5-base-qg-hl"
                tokenizer = T5Tokenizer.from_pretrained(model_name, legacy=False)
                model = T5ForConditionalGeneration.from_pretrained(model_name)
                _QA_PIPELINE = pipeline("text2text-generation", model=model, tokenizer=tokenizer, device=device)
                print("✅ QG model loaded.")
            except Exception as e:  # pragma: no cover
                print(f"❌ QG model load failed: {e}")
        else:
            print("⚠️ Transformers QG dependencies missing; skipping quiz model.")


def get_nlp():
    return _NLP


def get_rake():
    return _RAKE


def get_summarizer():
    return _SUMMARIZER


def get_qa_pipeline():
    return _QA_PIPELINE
