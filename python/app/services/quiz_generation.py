import random
from sentence_splitter import SentenceSplitter
from .models_loader import get_qa_pipeline, get_nlp

# Heuristic strategy: prefer model-based QG; if unavailable, derive cloze (named entity masking)
# or simple True/blank questions from semantically meaningful sentences.


def generate_quiz(text: str, num_questions: int = 5):
    qa = get_qa_pipeline()
    if not qa:
        return fallback_quiz(text, num_questions)

    splitter = SentenceSplitter(language='en')
    sentences = splitter.split(text=text)
    candidates = [s for s in sentences if 10 < len(s.split()) < 100]
    if not candidates:
        return fallback_quiz(text, num_questions)

    selected = random.sample(candidates, min(len(candidates), num_questions * 2))
    qa_pairs = []
    for sentence in selected:
        try:
            results = qa(sentence)
            if results:
                gen = results[0]['generated_text']
                if 'question:' in gen and 'answer:' in gen:
                    parts = gen.split('answer:')
                    question = parts[0].replace('question:', '').strip()
                    answer = parts[1].strip()
                    qa_pairs.append({'question': question, 'answer': answer})
        except Exception:
            continue

    if not qa_pairs:
        return fallback_quiz(text, num_questions)

    return {"quiz": qa_pairs[:num_questions]}


def fallback_quiz(text: str, num_questions: int = 5):
    nlp = get_nlp()
    if not nlp:
        return {"quiz": []}
    doc = nlp(text)
    sentences = [s.text.strip() for s in doc.sents if len(s.text.split()) > 5]
    if not sentences:
        return {"quiz": []}
    selected = random.sample(sentences, min(len(sentences), num_questions))
    quiz_questions = []
    for sentence in selected:
        ents = [ent.text for ent in nlp(sentence).ents if ent.label_ in ["PERSON", "ORG", "GPE"]]
        if ents:
            ent = ents[0]
            question = sentence.replace(ent, "______")
            quiz_questions.append({"question": f"Fill in the blank: {question}", "answer": ent})
        else:
            quiz_questions.append({"question": f"Is the following statement true: {sentence}?", "answer": "True"})
    return {"quiz": quiz_questions}
