from pydantic import BaseModel, Field
from typing import Optional, List


class PredictRequest(BaseModel):
    complaint_id: str
    account_id: Optional[str] = None
    current_location: Optional[str] = None


class LocationPrediction(BaseModel):
    location_id: str
    area: str
    latitude: float
    longitude: float
    probability: float
    risk_score: int


class PredictResponse(BaseModel):
    prediction_id: str
    complaint_id: str
    account_id: str
    risk_level: str
    top_locations: List[LocationPrediction]
    explanation: List[str]
    risk_breakdown: dict
    disclaimer: str = (
        "This is a probabilistic, AI-generated forecast for investigation "
        "prioritization only. It is not proof of criminal activity and must "
        "be independently verified by an authorized investigator."
    )


class InvestigationSummaryRequest(BaseModel):
    complaint_id: str


class DemoRunResponse(BaseModel):
    complaint: dict
    transactions: list
    network: dict
    prediction: PredictResponse
    summary: dict
