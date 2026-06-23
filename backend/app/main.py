from fastapi import FastAPI

app = FastAPI(title="akademy38 API")


@app.get("/health")
def health():
    return {"status": "ok"}
