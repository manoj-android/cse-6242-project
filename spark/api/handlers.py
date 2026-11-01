"""SPARK REST API Handlers.

Encapsulates request processing, parameter validation, and JSON response assembly
for all SPARK REST endpoints.
"""

import json
from typing import Dict, Any, Tuple
from pathlib import Path

from spark.data.db import (
    get_db_path,
    get_db_connection,
    get_all_pois_with_activities,
    SparkDataError
)
from spark.core.optimizer import optimize_spark_outing


def handle_health() -> Tuple[int, Dict[str, Any]]:
    """Handles GET /api/health request."""
    db_path = get_db_path()
    res = {
        "status": "healthy",
        "database": {
            "path": str(db_path),
            "exists": db_path.exists()
        },
        "service": "SPARK Backend (SQLite + Simulated Annealing)"
    }
    return 200, res


def handle_pois(child_age: float = 5.0) -> Tuple[int, Any]:
    """Handles GET /api/pois request."""
    pois = get_all_pois_with_activities(child_age=child_age)
    return 200, pois


def handle_age_profiles() -> Tuple[int, Any]:
    """Handles GET /api/age_profiles request."""
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM age_points ORDER BY min_age").fetchall()
        data = [dict(r) for r in rows]
    finally:
        conn.close()
    return 200, data


def handle_optimize_agenda(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """Handles POST /api/optimize_agenda request."""
    try:
        lat = float(payload.get("latitude", 34.0488))
        lon = float(payload.get("longitude", -118.2518))
        origin_name = payload.get("origin_name", payload.get("name", "Caregiver Home"))

        child_age = float(payload.get("child_age", payload.get("age", 5.0)))
        radius_miles = float(payload.get("radius_miles", payload.get("radius", 3.0)))
        target_stops = int(payload.get("n_activities", payload.get("target_stops", payload.get("stops", 2))))
        distance_penalty = float(payload.get("distance_penalty", 0.12))
        redundancy_penalty = float(payload.get("redundancy_penalty", 0.10))
        enforce_unique_pois = bool(payload.get("enforce_unique_pois", True))

        origin = {"latitude": lat, "longitude": lon, "name": origin_name}

        result = optimize_spark_outing(
            origin=origin,
            child_age=child_age,
            radius_miles=radius_miles,
            target_stops=target_stops,
            distance_penalty=distance_penalty,
            redundancy_penalty=redundancy_penalty,
            enforce_unique_pois=enforce_unique_pois
        )
        return 200, result

    except SparkDataError as e:
        return e.status_code, {"error": {"code": e.code, "message": e.message}}
    except Exception as e:
        return 500, {"error": {"code": "INTERNAL_ERROR", "message": str(e)}}

