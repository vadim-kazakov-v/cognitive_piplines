import pandas as pd

from .base import BaseNode, register


@register
class Describe(BaseNode):
    """Return descriptive statistics for the dataset."""

    def run(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        if data is None:
            raise ValueError("Describe node requires input data")
        return data.describe(include='all')
