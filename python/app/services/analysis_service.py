import os
from .text_processing import extract_text
from .keywords_sentiment import analyze_sentiment, extract_keywords
from .summarization import local_summarize, heuristic_summary
from .models_loader import get_nlp


def analyze_text(text: str) -> dict:
    sentiment = analyze_sentiment(text)
    keywords = extract_keywords(text)

    summary = ''
    # Prefer OpenAI if key present
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        try:
            import openai  # type: ignore
            openai.api_key = openai_key
            resp = openai.ChatCompletion.create(
                model='gpt-3.5-turbo',
                messages=[
                    {"role": "system", "content": "You summarize academic and technical documents."},
                    {"role": "user", "content": f"Summarize:\n{text}"},
                ],
                temperature=0.5,
                max_tokens=150,
            )
            summary = resp.choices[0].message['content'].strip()
        except Exception as e:  # pragma: no cover
            print(f"OpenAI summary failed: {e}")
            summary = local_summarize(text) or heuristic_summary(text)
    else:
        summary = local_summarize(text) or heuristic_summary(text)

    return {
        'summary': summary,
        'keywords': keywords,
        'sentiment': sentiment,
        'fullText': text,
    }


def analyze_file_content(raw: bytes, filename: str) -> dict:
    text = extract_text(raw, filename)
    return analyze_text(text)
