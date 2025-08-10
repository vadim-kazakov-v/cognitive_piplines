from pathlib import Path
from typing import Any, List

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
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
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    n_samples = data.shape[0]

    if n_samples < 2:
        return [[0.0, 0.0] for _ in range(n_samples)]

    params["perplexity"] = min(params.get("perplexity", 30), n_samples - 1)
    result = TSNE(n_components=2, **params).fit_transform(data)
    return result.tolist()


@app.post("/umap")
def umap(matrix: Matrix) -> list[list[float]]:
    """Compute a UMAP embedding for the given data."""

    import umap

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    n_samples = data.shape[0]

    n_components = int(params.pop("n_components", 2))
    n_components = min(max(n_components, 2), 3)

    if n_samples < 3:
        return [[0.0] * n_components for _ in range(n_samples)]

    n_neighbors = int(params.get("n_neighbors", 15))
    n_neighbors = min(max(n_neighbors, 2), n_samples - 1)
    params["n_neighbors"] = n_neighbors
    embedding = umap.UMAP(n_components=n_components, **params).fit_transform(data)
    return embedding.tolist()


@app.post("/dbscan")
def dbscan(matrix: Matrix) -> list[int]:
    """Cluster the given data using DBSCAN."""

    from sklearn.cluster import DBSCAN

    params = matrix.params or {}
    data = np.asarray(matrix.data)
    n_samples = data.shape[0]

    if n_samples == 0:
        return []

    params["min_samples"] = min(params.get("min_samples", 5), n_samples)
    labels = DBSCAN(**params).fit_predict(data)
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
