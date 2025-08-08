from pathlib import Path
import pandas as pd

from .base import BaseNode, register


@register
class LoadTitanic(BaseNode):
    """Load the Titanic CSV dataset."""

    def run(self, data=None, path: str = "data/titanic.csv", **kwargs) -> pd.DataFrame:
        return pd.read_csv(Path(path))
