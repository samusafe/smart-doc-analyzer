import os
import re
from typing import List
from .models_loader import get_summarizer, get_nlp

MIN_WORDS_FOR_SUMMARY = 50
CHUNK_SIZE_WORDS = 750


def clean_text(text: str) -> str:
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def local_summarize(text: str) -> str:
    summarizer = get_summarizer()
    if not summarizer:
        return 'Summarization model not available.'
    text = clean_text(text)
    words = text.split()
    if len(words) < MIN_WORDS_FOR_SUMMARY:
        return text

    def summarize_chunk(chunk: str) -> str:
        chunk_len = len(chunk.split())
        max_len = min(max(50, chunk_len // 2), 150)
        min_len = max(25, max_len // 2)
        if min_len >= max_len:
            min_len = max_len // 2
        res = summarizer(chunk, max_length=max_len, min_length=min_len, do_sample=False)
        return res[0]['summary_text'] if res else ''

    if len(words) > CHUNK_SIZE_WORDS:
        chunks = [' '.join(words[i:i + CHUNK_SIZE_WORDS]) for i in range(0, len(words), CHUNK_SIZE_WORDS)]
        chunk_summaries = [summarize_chunk(c) for c in chunks]
        combined = ' '.join(chunk_summaries)
        if len(combined.split()) > CHUNK_SIZE_WORDS:
            return summarize_chunk(combined)
        return combined
    return summarize_chunk(text)


def heuristic_summary(text: str) -> str:
    nlp = get_nlp()
    if not nlp:
        return text[:800]
    doc = nlp(text)
    sents = [s.text.strip() for s in doc.sents]
    return ' '.join(sents[:5])
