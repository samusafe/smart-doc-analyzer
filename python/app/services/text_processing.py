from io import BytesIO
from docx import Document
from PyPDF2 import PdfReader


def extract_text(file_content: bytes, filename: str) -> str:
    """Extract text from supported files."""
    fn = filename.lower()
    if fn.endswith('.docx'):
        return '\n'.join(p.text for p in Document(BytesIO(file_content)).paragraphs)
    if fn.endswith('.pdf'):
        return '\n'.join(page.extract_text() or '' for page in PdfReader(BytesIO(file_content)).pages)
    return file_content.decode('utf-8', errors='ignore')
