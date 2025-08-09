from pathlib import Path
from typing import List, Any

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cognitive Pipelines API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "titanic.csv"

df = pd.read_csv(DATA_PATH)


class Matrix(BaseModel):
    """Simple wrapper for a 2D list of floats and optional params."""

    data: List[List[float]]
    params: dict | None = None


class CodeRequest(BaseModel):
    code: str
    data: Any | None = None


@app.get("/health")
def health() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}


@app.get("/passengers")
def passengers(limit: int = 10) -> list[dict]:
    """Return a sample of Titanic passenger records.

    Args:
        limit: Number of rows to return.
    """
    return df.head(limit).to_dict(orient="records")


@app.post("/tsne")
def tsne(matrix: Matrix) -> list[list[float]]:
    """Compute a t-SNE embedding for the given data."""

    from sklearn.manifold import TSNE

    params = matrix.params or {}
    result = TSNE(n_components=2, **params).fit_transform(matrix.data)
    return result.tolist()


@app.post("/umap")
def umap(matrix: Matrix) -> list[list[float]]:
    """Compute a UMAP embedding for the given data."""

    import umap

    params = matrix.params or {}
    embedding = umap.UMAP(n_components=2, **params).fit_transform(matrix.data)
    return embedding.tolist()


@app.post("/dbscan")
def dbscan(matrix: Matrix) -> list[int]:
    """Cluster the given data using DBSCAN."""

    from sklearn.cluster import DBSCAN

    params = matrix.params or {}
    labels = DBSCAN(**params).fit_predict(matrix.data)
    return labels.tolist()


@app.post("/python")
def run_python(req: CodeRequest) -> Any:
    """Execute arbitrary Python code with optional data."""

    local = {"data": req.data}
    try:
        result = eval(req.code, {}, local)
    except Exception:
        exec(req.code, {}, local)
        result = local.get("result")
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
