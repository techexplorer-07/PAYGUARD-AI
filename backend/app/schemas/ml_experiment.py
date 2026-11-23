"""Pydantic v2 data contracts for Isolation Forest Anomaly Detection Experiment (Phase 2.2.4)."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelPredictionLabel(int, Enum):
    """Isolation Forest binary prediction labels."""

    ANOMALY = -1
    NORMAL = 1


class IsolationForestScore(BaseModel):
    """Raw and normalized scoring outputs from Isolation Forest anomaly detection."""

    raw_score_samples: float = Field(
        ...,
        description="Opposite of the average anomaly score of inputs. Lower values indicate higher anomaly severity.",
    )
    decision_function: float = Field(
        ...,
        description="Average anomaly score of inputs. Negative values indicate outlier classification.",
    )
    prediction: ModelPredictionLabel = Field(
        ...,
        description="-1 for outlier/anomaly, 1 for inlier/normal transaction.",
    )
    normalized_anomaly_severity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Heuristically calibrated anomaly index (0.0 to 1.0) derived from training baseline quantiles. Not a fraud probability.",
    )
    model_version: str = Field(..., description="Model artifact and hyperparameter configuration tag")
    training_sample_count: int = Field(..., description="Number of baseline normal transactions used during training")
    feature_vector_used: List[float] = Field(..., description="Deterministic numeric feature vector passed to model")
    assessment_notes: List[str] = Field(
        default_factory=list,
        description="Explanatory remarks on the unsupervised model assessment",
    )


class MetricComparison(BaseModel):
    """Classification metrics on held-out synthetic evaluation dataset."""

    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    accuracy: float


class ModelBenchmarkReport(BaseModel):
    """Comparative evaluation report contrasting Deterministic Scorer vs Isolation Forest."""

    dataset_name: str = Field(..., description="Name of evaluation dataset (strictly synthetic)")
    evaluation_sample_count: int = Field(..., description="Total number of evaluated scenarios")
    normal_sample_count: int = Field(..., description="Number of ground-truth normal scenarios")
    anomalous_sample_count: int = Field(..., description="Number of ground-truth anomalous scenarios")
    deterministic_metrics: MetricComparison = Field(..., description="Performance of existing rule-based scorer")
    isolation_forest_metrics: MetricComparison = Field(..., description="Performance of Isolation Forest model")
    scenario_breakdown: Dict[str, Dict[str, Any]] = Field(
        ..., description="Performance split by scenario archetype (single, compound, velocity, time)"
    )
    experiment_timestamp: datetime = Field(..., description="Timestamp of benchmark execution")
    methodology_notes: List[str] = Field(..., description="Experimental parameters and validation guardrails")
