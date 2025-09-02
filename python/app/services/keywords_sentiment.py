from textblob import TextBlob
from .models_loader import get_keybert_model

def analyze_sentiment(text: str) -> str:
    blob = TextBlob(text)
    if blob.sentiment.polarity > 0.1:
        return 'positive'
    if blob.sentiment.polarity < -0.1:
        return 'negative'
    return 'neutral'

def extract_keywords(text: str, top_n: int = 10):
    """
    Extracts relevant keywords and concepts using KeyBERT.
    """
    kw_model = get_keybert_model()
    if not kw_model:
        return []
    
    # Extract keywords with scores and return just the words
    keywords_with_scores = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),  # Allow single words and two-word phrases
        stop_words='english',
        top_n=top_n
    )
    
    return [kw for kw, score in keywords_with_scores]

