from fastapi import APIRouter, Body, HTTPException
from app.services.quiz_generation import generate_quiz
from app.services.models_loader import get_qa_pipeline
import os

router = APIRouter()

@router.post("/generate-quiz")
async def generate_quiz_endpoint(text: str = Body(..., embed=True)):
    """
    Endpoint to generate a quiz from a given text.
    ENABLE_QUIZ env (default enabled) gates loading of the QG model; if disabled or model missing,
    service falls back to heuristic quiz generation (see quiz_generation.fallback_quiz).
    Returns 503 if quiz explicitly enabled but model not ready.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text content is required.")

    if not get_qa_pipeline():
        # If user intended quiz (ENABLE_QUIZ true) but pipeline absent => 503; else heuristic later.
        if os.getenv("ENABLE_QUIZ", "1") not in ("0", "false", "False"):
            raise HTTPException(status_code=503, detail="Question Generation service is not available.")
        # fall through to heuristic path

    quiz_data = generate_quiz(text, num_questions=5)

    if not quiz_data or not quiz_data.get("quiz"):
        raise HTTPException(status_code=404, detail="Could not generate a quiz from the provided text.")

    return quiz_data
