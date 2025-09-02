from fastapi import FastAPI
from dotenv import load_dotenv
from app.api.router import api_router
from app.services.models_loader import load_models
import asyncio

# Load environment variables from .env file at the start
load_dotenv()

app = FastAPI(title="Intelligent Document Analyzer")

@app.on_event("startup")
async def startup_event():
    """
    Load Keybert model on application startup.
    """
    print("🚀 Starting up and loading models...")
    # Load models in a separate thread to avoid blocking
    await asyncio.get_event_loop().run_in_executor(None, load_models)
    print("✅ Models loaded successfully. API is ready!")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Document Analyzer API"}

app.include_router(api_router)
