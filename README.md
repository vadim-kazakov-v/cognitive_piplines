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
- `/umap` – dimensionality reduction via UMAP
- `/dbscan` – clustering with DBSCAN

## Frontend

A LiteGraph.js powered UI provides a visual editor for assembling analytics flows similar to n8n. Nodes are implemented as
small JavaScript extensions in `frontend/nodes/` and automatically appear in the sidebar when the page loads.

### Usage

With the backend running, open `frontend/index.html` in a web browser. Use the sidebar to add nodes and connect them to build custom flows. Available nodes include:

- **Titanic Sample** – load example passenger records
- **Select Field** – choose columns via dropdown or checkboxes
- **Bar Chart** and **Scatter Plot** – visualize numeric data
- **t‑SNE**, **UMAP**, and **DBSCAN** – run analytics algorithms on arrays of numbers
- **Log** – inspect any data in the developer console

Connect nodes to create analysis pipelines; for instance, link **Titanic Sample → Select Field (Fare) → t‑SNE → Scatter Plot** to see an embedding of fare values.

## Docker

Run the stack with Docker Compose:

```bash
docker compose up --build
```

The API will be available at [http://localhost:8000](http://localhost:8000) and the frontend at [http://localhost:8080](http://localhost:8080).
