from typing import Any, Dict, List

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

from .nodes import registry, BaseNode

app = FastAPI(title="Cognitive Pipelines")


class NodeSpec(BaseModel):
    node: str
    params: Dict[str, Any] = {}


class PipelineRequest(BaseModel):
    steps: List[NodeSpec]


@app.get("/nodes")
def list_nodes() -> List[str]:
    """Return the list of available nodes."""
    return list(registry.keys())


@app.post("/run")
def run_pipeline(req: PipelineRequest) -> Dict[str, Any]:
    data = None
    result = None
    for spec in req.steps:
        node_cls = registry.get(spec.node)
        if node_cls is None:
            raise ValueError(f"Unknown node {spec.node}")
        node: BaseNode = node_cls()
        result = node.run(data, **spec.params)
        if isinstance(result, pd.DataFrame):
            data = result
    if isinstance(result, pd.DataFrame):
        return {
            "columns": result.columns.tolist(),
            "preview": result.head().to_dict(orient="records"),
        }
    return {"result": result}
