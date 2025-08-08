from typing import List, Optional

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from .base import BaseNode, register


@register
class LogisticModel(BaseNode):
    """Train a logistic regression model to predict survival."""

    def run(
        self,
        data: pd.DataFrame,
        target: str = "Survived",
        features: Optional[List[str]] = None,
        **kwargs,
    ):
        if data is None:
            raise ValueError("LogisticModel requires input data")
        if features is None:
            features = ["Pclass", "Sex", "Age", "Fare", "Embarked"]
        df = data[features + [target]].dropna().copy()
        df = pd.get_dummies(df, columns=[c for c in df.columns if df[c].dtype == "object"], drop_first=True)
        X = df.drop(columns=[target])
        y = df[target]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = LogisticRegression(max_iter=1000)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        return {"accuracy": acc}
