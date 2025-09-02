from fastapi import APIRouter
import os, time
from app.services.models_loader import get_keybert_model, get_summarizer, get_qa_pipeline

router = APIRouter()

_START_TIME = time.time()
_VERSION = os.getenv("APP_VERSION", "v1")

def _bool(x):
    return x is not None

@router.get("/health")
async def health():
    keybert_ready = _bool(get_keybert_model())
    summarizer_ready = _bool(get_summarizer())
    qa_ready = _bool(get_qa_pipeline())
    models_ready = keybert_ready and summarizer_ready and qa_ready
    return {
        "status": "ok" if models_ready else "degraded",
        "version": _VERSION,
        "uptimeSeconds": int(time.time() - _START_TIME),
        "models": {
            "keybert": keybert_ready,
            "rake": rake_ready,
            "summarizer": summarizer_ready,
            "quizModel": qa_ready,
        },
        "allReady": models_ready,
    }
