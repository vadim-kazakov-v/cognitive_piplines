from typing import Any, Dict, Optional
import pandas as pd


class BaseNode:
    """Base class for pipeline nodes."""
    def run(self, data: Optional[pd.DataFrame], **kwargs) -> Any:  # pragma: no cover - runtime logic
        raise NotImplementedError


registry: Dict[str, type] = {}


def register(cls: type) -> type:
    """Class decorator to register available nodes."""
    registry[cls.__name__] = cls
    return cls
