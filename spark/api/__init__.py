"""SPARK API & Delivery Layer."""

from .handlers import (
    handle_health,
    handle_pois,
    handle_age_profiles,
    handle_optimize_agenda
)
from .server import run_server, SparkCleanRequestHandler

__all__ = [
    "handle_health",
    "handle_pois",
    "handle_age_profiles",
    "handle_optimize_agenda",
    "run_server",
    "SparkCleanRequestHandler"
]

