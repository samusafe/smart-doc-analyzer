from textblob import TextBlob
from .models_loader import get_rake


def analyze_sentiment(text: str) -> str:
    blob = TextBlob(text)
    if blob.sentiment.polarity > 0.1:
        return 'positive'
    if blob.sentiment.polarity < -0.1:
        return 'negative'
    return 'neutral'


def extract_keywords(text: str, top_n: int = 10):
    rake = get_rake()
    if not rake:
        return []
    rake.extract_keywords_from_text(text)
    return [phrase for score, phrase in rake.get_ranked_phrases_with_scores()[:top_n]]
