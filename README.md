# Cognitive Pipelines

Prototype web-based system for exploring the classic Titanic dataset using a node-based UI.

## Development

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the backend API:

   ```bash
   uvicorn backend.app:app --reload
   ```

3. Open `frontend/index.html` in a browser. The interface uses a dark theme and lists
   available nodes that can be connected similar to n8n.

## Docker

Build and run using Docker Compose:

```bash
docker compose up --build
```

The API will be available at `http://localhost:8000` and the frontend at
`http://localhost:3000`.

## Available Nodes

- **LoadTitanic** – load the Titanic CSV dataset.
- **Filter** – filter rows using a pandas query string.
- **Describe** – compute descriptive statistics for the current data frame.
- **LogisticModel** – train a logistic regression model to predict survival.

Nodes are registered automatically via a simple decorator mechanism allowing the
architecture to scale by adding new nodes under `backend/nodes`.
