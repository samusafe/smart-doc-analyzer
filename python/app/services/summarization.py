import os
import re
from .models_loader import get_summarizer

# --- Constants for easier configuration ---
SUMMARIZER_MODEL_NAME = os.getenv("SUMMARIZER_MODEL_NAME", "facebook/bart-large-cnn")
MIN_WORDS_FOR_SUMMARY = 50
CHUNK_SIZE_WORDS = 750

def clean_text(text: str) -> str:
    """Removes citation numbers and normalizes whitespace."""
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def local_summarize(text: str) -> str:
    """
    Summarizes a long text using a local model with a map-reduce strategy.
    The text is split into chunks, each chunk is summarized, and then the
    summaries are combined and summarized again for a final result.
    The summary length is dynamic based on the input.
    """
    summarizer = get_summarizer()
    if not summarizer:
        return "Summarization model not available."

    text = clean_text(text)
    words = text.split()
    if len(words) < MIN_WORDS_FOR_SUMMARY:
        return text  # Return original text if it's too short to summarize

    # Use the model's tokenizer for more accurate chunking
    try:
        tokenizer = summarizer.tokenizer
        tokens = tokenizer.encode(text)
        # Use the model's max length to define chunk size for better safety
        max_chunk_size = tokenizer.model_max_length - 50 
        token_chunks = [tokens[i:i + max_chunk_size] for i in range(0, len(tokens), max_chunk_size)]
        text_chunks = [tokenizer.decode(chunk, skip_special_tokens=True) for chunk in token_chunks]
    except Exception:
        # Fallback to word-based chunking if tokenizer fails
        text_chunks = [' '.join(words[i:i + CHUNK_SIZE_WORDS]) for i in range(0, len(words), CHUNK_SIZE_WORDS)]


    def summarize_chunk(chunk_text: str, is_final_summary: bool = False) -> str:
        """Summarizes a single chunk of text with dynamic length."""
        chunk_word_count = len(chunk_text.split())
        
        if is_final_summary:
            max_len = max(100, int(chunk_word_count * 0.30))
            min_len = max(50, int(chunk_word_count * 0.15))
        else:
            max_len = max(60, int(chunk_word_count * 0.5))
            min_len = max(30, int(chunk_word_count * 0.25))
        
        if min_len >= max_len:
            min_len = max_len // 2

        try:
            summary_list = summarizer(chunk_text, max_length=max_len, min_length=min_len, do_sample=False)
            return summary_list[0]['summary_text'] if summary_list else ''
        except Exception as e:
            print(f"Error during summarization of a chunk: {e}")
            return heuristic_summary(chunk_text)

    if len(text_chunks) == 1:
        return summarize_chunk(text_chunks[0], is_final_summary=True)

    chunk_summaries = [summarize_chunk(chunk) for chunk in text_chunks]
    combined_summary_text = " ".join(filter(None, chunk_summaries))
    
    if not combined_summary_text.strip():
        return heuristic_summary(text) # Fallback if all chunks failed

    final_summary = summarize_chunk(combined_summary_text, is_final_summary=True)
    
    return final_summary


def heuristic_summary(text: str) -> str:
    """
    Creates a simple, non-AI summary by taking the first few sentences.
    This is a fallback for when the main summarization model fails.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    summary_sentences = sentences[:4]
    return ' '.join(summary_sentences)
