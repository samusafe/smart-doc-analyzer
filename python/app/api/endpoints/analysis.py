from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.analysis_service import analyze_file_content

router = APIRouter()

@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """
    Endpoint to analyze a single uploaded file.
    Extracts text and performs Keybert analysis.
    """
    raw_content = await file.read()
    filename = file.filename.lower()

    try:
        result = analyze_file_content(raw_content, filename)
        if not result.get('fullText') or not result['fullText'].strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the file. It might be empty or corrupted.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format or corrupted file: {e}")
