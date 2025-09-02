from io import BytesIO
from docx import Document
import fitz 

def extract_text(file_content: bytes, filename: str) -> str:
    """Extract text from supported files using the best library for each format."""
    fn = filename.lower()
    if fn.endswith('.docx'):
        return '\n'.join(p.text for p in Document(BytesIO(file_content)).paragraphs)
    if fn.endswith('.pdf'):
        with fitz.open(stream=file_content, filetype="pdf") as doc:
            return "\n".join(page.get_text() for page in doc)
    return file_content.decode('utf-8', errors='ignore')
