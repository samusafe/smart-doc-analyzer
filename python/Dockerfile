# Python service Dockerfile
# syntax=docker/dockerfile:1.7

# Base stage with dependencies
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    NLTK_DATA=/usr/local/share/nltk_data
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential wget \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm \
    && python -c "import nltk,os,pathlib; p=os.environ.get('NLTK_DATA','/usr/local/share/nltk_data'); pathlib.Path(p).mkdir(parents=True, exist_ok=True); [nltk.download(x, download_dir=p) for x in ['stopwords','punkt','punkt_tab']]"
RUN chmod -R 755 "$NLTK_DATA"

# Development stage with hot-reloading
FROM base AS development
WORKDIR /app
COPY ./app /app/app
RUN useradd -m appuser
USER appuser
EXPOSE 5000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]

# Production stage (final, optimized image)
FROM base AS production
WORKDIR /app
COPY ./app /app/app
RUN useradd -m appuser
USER appuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:5000/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]