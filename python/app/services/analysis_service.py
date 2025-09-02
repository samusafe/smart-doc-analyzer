from .text_processing import extract_text
from .keywords_sentiment import analyze_sentiment, extract_keywords
from .summarization import local_summarize, heuristic_summary
import re

def analyze_text(text: str) -> dict:
    """
    Analyzes the given text to extract sentiment, keywords, and a structured summary.
    This version uses only local models to ensure zero cost and provides a more
    study-friendly output.
    """
    sentiment = analyze_sentiment(text)
    keywords = extract_keywords(text)
    
    # Generate summary using the local, improved summarization function
    summary_paragraph = local_summarize(text) or heuristic_summary(text)
    
    # Generate bullet points from the summary paragraph by splitting it into sentences.
    summary_points = [s.strip() for s in re.split(r'(?<=[.!?])\s+', summary_paragraph) if s.strip()]

    return {
        'summary': summary_paragraph,
        'summary_points': summary_points,
        'keywords': keywords,
        'sentiment': sentiment,
        'fullText': text,
    }


def analyze_file_content(raw: bytes, filename: str) -> dict:
    text = extract_text(raw, filename)
    return analyze_text(text)
