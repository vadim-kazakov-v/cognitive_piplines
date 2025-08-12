# Cognitive Pipelines

Web-based system for exploring the classic Titanic dataset using an n8n‑style node editor that can produce data visualizations.

## Backend

A simple [FastAPI](https://fastapi.tiangolo.com/) backend serves sample data from the
`data/titanic.csv` file.

### Setup

```bash
pip install -r requirements.txt
python backend/server.py
```

The API will be available at `http://localhost:8000`. A health check is exposed at
`/health` and sample passenger data can be queried via `/passengers?limit=10`.
Additional endpoints provide machine learning helpers used by the UI:

- `/tsne` – dimensionality reduction via t‑SNE
- `/umap` – dimensionality reduction via UMAP (supports `n_components` 1–50, `min_dist`, and `metric`)
- `/dbscan` – clustering with DBSCAN
- `/spectral` – clustering with spectral clustering
- `/kmeans` – clustering with K‑means
- `/gmm` – clustering with Gaussian mixture models
- `/pca` – dimensionality reduction via PCA
- `/isolation_forest` – anomaly detection with Isolation Forest
- `/lof` – anomaly detection with Local Outlier Factor

## Frontend

A LiteGraph.js powered UI provides a visual editor for assembling analytics flows similar to n8n. Nodes are implemented as
small JavaScript extensions in `frontend/nodes/` and automatically appear in the sidebar when the page loads.

### Usage

With the backend running, open `frontend/index.html` in a web browser. Use the sidebar to add nodes and connect them to build custom flows. Available nodes include:

- **Titanic Sample** – load example passenger records
- **Select Field** – choose columns via dropdown or checkboxes
- **To Number**, **To String**, **To Boolean**, and **Rescale** – convert values or scale numeric ranges
- **Bar Chart**, **Scatter Plot**, and **Scatter3D** – visualize numeric data
- **Voronoi Diagram** – display Voronoi cells for point sets with selectable X/Y columns
- **Persistence Diagram** and **Vietoris-Rips** – topological data analysis visuals for point clouds
- **t‑SNE**, **UMAP**, **PCA**, **DBSCAN**, and **KMeans** – run analytics algorithms on arrays of numbers
- **Spectral**, **GMM** – additional clustering tools
- **Isolation Forest**, **Local Outlier Factor** – anomaly detection
- **Random Series**, **Sine Wave** – generate time-series data
- **Lissajous** – visualize x/y signals as Lissajous figures
- **Log** – inspect any data in the developer console

Connect nodes to create analysis pipelines; for instance, link **Titanic Sample → Select Field (Fare) → t‑SNE → Scatter Plot** to see an embedding of fare values.

## Docker

Run the stack with Docker Compose:

```bash
docker compose up --build
```

The API will be available at [http://localhost:8000](http://localhost:8000) and the frontend at [http://localhost:8080](http://localhost:8080).
