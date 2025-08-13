from pathlib import Path
from typing import Any, List
import base64
import pickle

import math
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cognitive Pipelines API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "titanic.csv"

df = pd.read_csv(DATA_PATH)

FEATURES = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare"]
_explain_df = df[FEATURES + ["Survived"]].dropna()
_explain_df["Sex"] = _explain_df["Sex"].map({"male": 0, "female": 1})
X_explain = _explain_df[FEATURES].values
y_explain = _explain_df["Survived"].values
from sklearn.ensemble import RandomForestClassifier
_EXPLAIN_MODEL = RandomForestClassifier(n_estimators=50, random_state=0).fit(
    X_explain, y_explain
)


class Matrix(BaseModel):
    """Simple wrapper for a 2D list of floats and optional params."""

    data: List[List[float]]
    params: dict | None = None


class TableData(BaseModel):
    """Wrapper for arbitrary table-like data."""

    data: Any


class CodeRequest(BaseModel):
    code: str
    data: Any | None = None



def autoencoderProjection(data: np.ndarray, latent_dim: int) -> np.ndarray:
    """Project data into a latent space using a simple autoencoder."""
    from sklearn.neural_network import MLPRegressor

    model = MLPRegressor(
        hidden_layer_sizes=(latent_dim,),
        activation="relu",
        max_iter=500,
    )
    model.fit(data, data)
    W1, b1 = model.coefs_[0], model.intercepts_[0]
    hidden = np.dot(data, W1) + b1
    hidden = np.maximum(0, hidden)
    return hidden


def somProjection(data: np.ndarray, grid_size: int) -> list[list[int]]:
    """Project data using a self-organizing map and return winning neuron coords."""
    from minisom import MiniSom

    som = MiniSom(grid_size, grid_size, data.shape[1], sigma=1.0, learning_rate=0.5)
    som.random_weights_init(data)
    som.train_random(data, 100)
    return [list(som.winner(x)) for x in data]

class ExplainRequest(BaseModel):
    model: str | None = None
    data: List[List[float]]


class RFTrainRequest(BaseModel):
    data: List[List[float]]
    target: List[float]


class RFPredictRequest(BaseModel):
    model: str
    data: List[List[float]]


class Series(BaseModel):
    """Wrapper for a list of numeric values."""

    data: List[float]
    params: dict | None = None

def detectAnchoring(values: np.ndarray) -> float:
    """Simple anchoring bias score based on distance of first item from the rest."""
    if values.size < 2:
        return 0.0
    rest = values[1:]
    mean_rest = rest.mean()
    std_rest = rest.std() or 1.0
    return float(abs(values[0] - mean_rest) / std_rest)


def estimateVisualClutter(values: np.ndarray) -> float:
    """Rough estimate of visual clutter based on unique value ratio."""
    if values.size == 0:
        return 0.0
    unique = np.unique(values).size
    return float(unique / values.size)


def checkScaleBias(values: np.ndarray) -> float:
    """Detect potential scale bias via max/min ratio."""
    if values.size == 0:
        return 0.0
    min_val = values.min()
    max_val = values.max()
    if min_val == 0:
        return float('inf') if max_val != 0 else 0.0
    return float(max_val / min_val)

      
class PaletteParams(BaseModel):
    """Parameters for palette generation."""

    n: int = 5
    lightness: float = 70.0
    chroma: float = 40.0

      
class ImshowRequest(BaseModel):
    data: List[List[float]]
    cmap: str = "viridis"
    interpolation: str = "nearest"
    vmin: float | None = None
    vmax: float | None = None



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


@app.post("/describe")
def describe_table(req: TableData) -> dict:
    """Return descriptive statistics for arbitrary table-like data."""
    try:
        frame = pd.DataFrame(req.data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return frame.describe(include="all").replace({np.nan: None}).to_dict()



@app.post("/rf_train")
def rf_train(req: RFTrainRequest) -> dict:
    """Train a RandomForest model and return it serialized."""
    from sklearn.ensemble import RandomForestClassifier

    try:
        data = np.asarray(req.data, dtype=float)
        target = np.asarray(req.target, dtype=float)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    model = RandomForestClassifier(n_estimators=100, random_state=0).fit(
        data, target
    )
    model_bytes = pickle.dumps(model)
    model_str = base64.b64encode(model_bytes).decode("ascii")
    return {
        "model": model_str,
        "importance": model.feature_importances_.tolist(),
    }


@app.post("/rf_predict")
def rf_predict(req: RFPredictRequest) -> list[float]:
    """Run predictions using a serialized RandomForest model."""
    try:
        model_bytes = base64.b64decode(req.model.encode("ascii"))
        model = pickle.loads(model_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    try:
        data = np.asarray(req.data, dtype=float)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    preds = model.predict(data)
    return preds.tolist()


@app.post("/explain")
def explain(req: ExplainRequest) -> list[list[dict]]:
    """Return feature contributions for a model.

    The endpoint returns a list for each input row, where each row
    contains dictionaries mapping feature names to their SHAP
    contributions. Returning a consistent list-of-lists structure avoids
    FastAPI's response validation errors when multiple rows are
    provided.
    """
    try:
        import shap
    except Exception as exc:  # pragma: no cover - shap missing
        raise HTTPException(status_code=500, detail=str(exc))
    try:
        data = np.asarray(req.data, dtype=float)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if data.ndim == 1:
        data = data.reshape(1, -1)
    model = _EXPLAIN_MODEL
    feature_names = FEATURES
    if req.model:
        try:
            model_bytes = base64.b64decode(req.model.encode("ascii"))
            model = pickle.loads(model_bytes)
            feature_names = [f"f{i}" for i in range(data.shape[1])]
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    if data.shape[1] != len(feature_names):
        raise HTTPException(status_code=400, detail="Invalid feature count")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(data)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    elif getattr(shap_values, "ndim", 0) == 3:
        shap_values = shap_values[..., 1]
    result = []
    for row in shap_values:
        result.append(
            [
                {"feature": f, "contribution": float(v)}
                for f, v in zip(feature_names, row)
            ]
        )
    return result


@app.post("/confidence")
def confidence_interval(series: Series) -> dict:
    """Return mean and confidence interval for a numeric series."""
    params = series.params or {}
    try:
        data = np.asarray(series.data, dtype=float)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    n = data.size
    if n == 0:
        return {"mean": None, "lower": None, "upper": None}
    alpha = float(params.get("alpha", 0.95))
    mean = float(np.mean(data))
    if n < 2:
        return {"mean": mean, "lower": mean, "upper": mean}
    se = np.std(data, ddof=1) / np.sqrt(n)
    from scipy.stats import t as t_dist

    h = t_dist.ppf((1 + alpha) / 2, n - 1) * se
    lower = mean - h
    upper = mean + h
    return {"mean": mean, "lower": float(lower), "upper": float(upper)}

@app.post("/bias-report")
def bias_report(req: TableData) -> dict:
    """Return simple bias metrics for a sequence of numeric values."""
    try:
        values = np.asarray(req.data, dtype=float).flatten()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    anchoring_score = detectAnchoring(values)
    clutter_score = estimateVisualClutter(values)
    scale_score = checkScaleBias(values)
    return {
        "anchoring": {
            "score": anchoring_score,
            "message": "⚠️ anchoring" if anchoring_score > 1 else "✅ ok",
        },
        "clutter": {
            "score": clutter_score,
            "message": "⚠️ clutter" if clutter_score > 0.7 else "✅ ok",
        },
        "scale": {
            "score": scale_score,
            "message": "⚠️ scale" if scale_score > 100 else "✅ ok",
        },
    }




@app.post("/tsne")
def tsne(matrix: Matrix) -> list[list[float]]:
    """Compute a t-SNE embedding for the given data."""

    from sklearn.manifold import TSNE

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except (ValueError, TypeError) as exc:
        # surface invalid numeric inputs as 400 errors instead of crashing
        raise HTTPException(status_code=400, detail=str(exc))

    if data.ndim != 2:
        raise HTTPException(status_code=400, detail="Input must be a 2D array")

    n_samples = data.shape[0]
    if n_samples < 2:
        # t-SNE requires at least two samples; return a trivial embedding
        return [[0.0, 0.0] for _ in range(n_samples)]

    # ensure perplexity is valid for the number of samples
    perplexity_raw = params.get("perplexity", 30)
    try:
        perplexity = float(perplexity_raw)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid perplexity: {exc}")
    perplexity = max(1.0, min(perplexity, n_samples - 1))
    params["perplexity"] = perplexity

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
    n_components = min(max(n_components, 1), 50)

    if "min_dist" in params:
        params["min_dist"] = max(0.0, min(1.0, float(params["min_dist"])))

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


@app.post("/spectral")
def spectral(matrix: Matrix) -> list[int]:
    """Cluster the given data using spectral clustering."""

    from sklearn.cluster import SpectralClustering

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    n_samples = data.shape[0]
    if n_samples == 0:
        return []

    n_clusters = int(params.get("n_clusters", 8))
    n_clusters = min(max(n_clusters, 1), n_samples)
    params["n_clusters"] = n_clusters
    labels = SpectralClustering(**params).fit_predict(data)
    return labels.tolist()


@app.post("/kmeans")
def kmeans(matrix: Matrix) -> dict:
    """Cluster the given data using K-means."""

    from sklearn.cluster import KMeans

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    n_samples = data.shape[0]
    if n_samples == 0:
        return {"labels": [], "centers": []}

    n_clusters = int(params.get("n_clusters", 8))
    n_clusters = min(max(n_clusters, 1), n_samples)
    params["n_clusters"] = n_clusters
    kmeans = KMeans(**params).fit(data)
    return {
        "labels": kmeans.labels_.tolist(),
        "centers": kmeans.cluster_centers_.tolist(),
    }


@app.post("/gmm")
def gmm(matrix: Matrix) -> dict:
    """Cluster the data using a Gaussian mixture model."""

    from sklearn.mixture import GaussianMixture

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    n_samples = data.shape[0]
    if n_samples == 0:
        return {"labels": [], "means": []}

    n_components = int(params.get("n_components", 1))
    n_components = min(max(n_components, 1), n_samples)
    params["n_components"] = n_components
    model = GaussianMixture(**params).fit(data)
    labels = model.predict(data).tolist()
    means = model.means_.tolist()
    return {"labels": labels, "means": means}


@app.post("/isolation_forest")
def isolation_forest(matrix: Matrix) -> list[int]:
    """Detect outliers using the Isolation Forest algorithm."""

    from sklearn.ensemble import IsolationForest

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if data.size == 0:
        return []

    model = IsolationForest(**params).fit(data)
    labels = model.predict(data)
    return labels.tolist()


@app.post("/lof")
def local_outlier_factor(matrix: Matrix) -> list[int]:
    """Detect outliers using Local Outlier Factor."""

    from sklearn.neighbors import LocalOutlierFactor

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    n_samples = len(data)
    if n_samples == 0:
        return []

    n_neighbors = int(params.get("n_neighbors", 20))
    n_neighbors = min(max(n_neighbors, 1), n_samples - 1) if n_samples > 1 else 1
    params["n_neighbors"] = n_neighbors
    model = LocalOutlierFactor(**params)
    labels = model.fit_predict(data)
    return labels.tolist()


@app.post("/pca")
def pca(matrix: Matrix) -> list[list[float]]:
    """Compute a PCA embedding for the given data."""

    from sklearn.decomposition import PCA

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if data.size == 0:
        return []

    n_components = int(params.get("n_components", 2))
    n_components = min(max(n_components, 1), data.shape[1])
    params["n_components"] = n_components
    embedding = PCA(**params).fit_transform(data)
    return embedding.tolist()


@app.post("/hyperdr")
def hyperdr(matrix: Matrix) -> list[list[float]]:
    """Hybrid dimensionality reduction via autoencoder or SOM."""

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    method = params.get("method", "autoencoder")
    if method == "autoencoder":
        latent = int(params.get("latent_dim", 2))
        result = autoencoderProjection(data, latent)
    elif method == "som":
        grid = int(params.get("grid_size", 10))
        result = np.asarray(somProjection(data, grid), dtype=float)
    else:
        raise HTTPException(status_code=400, detail="Unknown method")

    return result.tolist()


@app.post("/persistence")
def persistence_diagram(matrix: Matrix) -> list[list[list[float | None]]]:
    """Compute a persistence diagram for a point cloud."""

    from ripser import ripser

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if data.size == 0:
        return []

    maxdim = int(params.get("maxdim", 1))
    result = ripser(data, maxdim=maxdim)
    dgms = result.get("dgms", [])
    cleaned: list[list[list[float | None]]] = []
    for dgm in dgms:
        cleaned.append(
            [
                [float(b), None if np.isinf(d) else float(d)]
                for b, d in dgm
            ]
        )
    return cleaned


@app.post("/vietoris_rips")
def vietoris_rips(matrix: Matrix) -> list[list[int]]:
    """Return edges of the Vietoris–Rips complex for epsilon."""

    from sklearn.metrics import pairwise_distances

    params = matrix.params or {}
    try:
        data = np.asarray(matrix.data, dtype=float)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if data.ndim != 2:
        raise HTTPException(status_code=400, detail="Input must be a 2D array")

    n_samples = data.shape[0]
    if n_samples == 0:
        return []

    epsilon = float(params.get("epsilon", 1.0))
    dists = pairwise_distances(data)
    edges: list[list[int]] = []
    for i in range(n_samples):
        for j in range(i + 1, n_samples):
            if dists[i, j] <= epsilon:
                edges.append([i, j])
    return edges


@app.post("/imshow")
def imshow(req: ImshowRequest) -> str:
    """Render an array as an image using Matplotlib."""

    import base64
    import io
    import matplotlib.pyplot as plt

    try:
        data = np.asarray(req.data, dtype=float)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    fig, ax = plt.subplots()
    ax.imshow(
        data,
        cmap=req.cmap,
        interpolation=req.interpolation,
        vmin=req.vmin,
        vmax=req.vmax,
    )
    ax.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


@app.post("/python")
def run_python(req: CodeRequest) -> Any:
    """Execute arbitrary Python code with optional data."""

    # share a single namespace for executed code so that functions defined
    # within the provided snippet can access variables defined alongside
    # them. Using separate globals and locals (as done previously) causes
    # lookups for these variables to fail when the function is executed.
    namespace = {"data": req.data}
    try:
        # try to evaluate the code as an expression first
        result = eval(req.code, namespace)
    except Exception:
        # fall back to executing statements; any variable named ``result``
        # will be returned to the caller
        exec(req.code, namespace)
        result = namespace.get("result")
    # ensure the result is JSON serialisable
    if callable(result):
        return repr(result)
    try:
        from fastapi.encoders import jsonable_encoder

        return jsonable_encoder(result)
    except Exception as exc:  # pragma: no cover - fallback on serialization issues
        raise HTTPException(status_code=400, detail=f"Unable to serialize result: {exc}")


def lch_to_lab(l: float, c: float, h: float) -> tuple[float, float, float]:
    hr = math.radians(h)
    return l, math.cos(hr) * c, math.sin(hr) * c


def lab_to_rgb(l: float, a: float, b: float) -> list[int]:
    y = (l + 16.0) / 116.0
    x = a / 500.0 + y
    z = y - b / 200.0

    def pivot(t: float) -> float:
        t3 = t ** 3
        return t3 if t3 > 0.008856 else (t - 16.0 / 116.0) / 7.787

    x = pivot(x) * 95.047
    y = pivot(y) * 100.0
    z = pivot(z) * 108.883
    x /= 100.0
    y /= 100.0
    z /= 100.0
    r = x * 3.2406 + y * -1.5372 + z * -0.4986
    g = x * -0.9689 + y * 1.8758 + z * 0.0415
    b2 = x * 0.0557 + y * -0.2040 + z * 1.0570

    def comp(c: float) -> float:
        return 1.055 * (c ** (1 / 2.4)) - 0.055 if c > 0.0031308 else 12.92 * c

    r = comp(r)
    g = comp(g)
    b2 = comp(b2)
    return [
        int(max(0, min(255, round(r * 255)))),
        int(max(0, min(255, round(g * 255)))),
        int(max(0, min(255, round(b2 * 255)))),
    ]


def rgb_to_hex(rgb: list[int]) -> str:
    return "#%02x%02x%02x" % tuple(rgb)


def suggest_palette(params: PaletteParams) -> list[str]:
    colors = []
    n = max(1, int(params.n))
    for i in range(n):
        h = 360 * i / n
        lab = lch_to_lab(params.lightness, params.chroma, h)
        colors.append(rgb_to_hex(lab_to_rgb(*lab)))
    return colors


@app.post("/palette")
def palette_endpoint(req: PaletteParams) -> list[str]:
    """Return a perceptually spaced colour palette."""
    return suggest_palette(req)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
