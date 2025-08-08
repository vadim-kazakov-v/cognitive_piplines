import pandas as pd

from .base import BaseNode, register


@register
class Filter(BaseNode):
    """Filter rows in the DataFrame using a pandas query expression."""

    def run(self, data: pd.DataFrame, query: str, **kwargs) -> pd.DataFrame:
        if data is None:
            raise ValueError("Filter node requires input data")
        return data.query(query)
