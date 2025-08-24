from fastapi import APIRouter
from app.api.endpoints import analysis, quiz, health

api_router = APIRouter()

api_router.include_router(analysis.router, tags=["Analysis"])
api_router.include_router(quiz.router, tags=["Quiz"])
api_router.include_router(health.router, tags=["Health"])
