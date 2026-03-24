from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime

class CategoryScore(BaseModel):
    category: str
    confidence: float
    label: str

class PredictionResponse(BaseModel):
    id: int
    predicted_category: str
    confidence: float
    all_scores: Dict[str, float]
    top_categories: List[CategoryScore]
    is_fraudulent: bool
    fraud_probability: float
    timestamp: datetime
    processing_time_ms: float
