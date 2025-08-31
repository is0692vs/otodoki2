# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# システム依存の最低限ツール
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係のレイヤーを固定
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリ本体
COPY app ./app

EXPOSE 8000

# uvicorn 起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]