from fastapi import APIRouter
import os, time
from app.services.models_loader import get_nlp, get_rake, get_summarizer, get_qa_pipeline

router = APIRouter()

_START_TIME = time.time()
_VERSION = os.getenv("APP_VERSION", "v1")

def _bool(x):
    return x is not None

@router.get("/health")
async def health():
    nlp_ready = _bool(get_nlp())
    rake_ready = _bool(get_rake())
    summarizer_ready = _bool(get_summarizer())
    qa_ready = _bool(get_qa_pipeline())
    quiz_enabled = os.getenv("ENABLE_QUIZ", "1") not in ("0", "false", "False")
    models_ready = nlp_ready and summarizer_ready and (not quiz_enabled or qa_ready)
    return {
        "status": "ok" if models_ready else "degraded",
        "version": _VERSION,
        "uptimeSeconds": int(time.time() - _START_TIME),
        "models": {
            "nlp": nlp_ready,
            "rake": rake_ready,
            "summarizer": summarizer_ready,
            "quizModel": qa_ready,
        },
        "quizEnabled": quiz_enabled,
        "allReady": models_ready,
    }
