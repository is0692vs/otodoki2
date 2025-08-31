from fastapi import FastAPI

app = FastAPI(title="otodoki2 API", version="0.1.0")

@app.get("/")
def root():
    return {"message": "otodoki2 backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}