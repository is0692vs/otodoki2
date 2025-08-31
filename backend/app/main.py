from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import os
from datetime import datetime

app = FastAPI(title="otodoki2 API", version="1.0.0")

# CORS設定（開発環境用）
origins = os.getenv("ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # 当面はCookieを使わない前提
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "*"],
)

# アプリケーション開始時刻を記録
start_time = time.time()


@app.get("/")
def read_root():
    return {"message": "Hello from backend", "service": "otodoki2-api"}


@app.get("/health")
def read_health():
    current_time = time.time()
    uptime = current_time - start_time
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": round(uptime, 2),
        "service": "otodoki2-api"
    }
