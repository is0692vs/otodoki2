from fastapi import FastAPI
import time
from datetime import datetime

app = FastAPI(title="otodoki2 API", version="1.0.0")

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
