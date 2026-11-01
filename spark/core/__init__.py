"""SPARK Core Domain & Optimization Layer."""

from .models import (
    OriginLocation,
    MilestoneVector,
    ItineraryStop,
    OutingOptimizationPlan
)
from .optimizer import (
    haversine_miles,
    build_candidates,
    optimize_agenda,
    sequence_2opt,
    optimize_spark_outing
)

__all__ = [
    "OriginLocation",
    "MilestoneVector",
    "ItineraryStop",
    "OutingOptimizationPlan",
    "haversine_miles",
    "build_candidates",
    "optimize_agenda",
    "sequence_2opt",
    "optimize_spark_outing"
]

