"""SPARK Data Access Layer (DAL) & SQLite Repository.

Encapsulates data persistence and database queries against SQLite (`spark/data/poi.db`).
Provides normalized access to venues, relational activities, developmental vectors,
and continuous pediatric age milestone weights.
"""

import sqlite3
import os
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd

# 8 Foundational CDC Pediatric Development Factors
FACTORS = [
    "soc_emot", "cog_exec", "lang_comm", "phys_motor",
    "expl_creat", "found_knowl", "ind_lifeskills", "health"
]

DOMAIN_MAPPING = {
    "phys_motor": "Motor",
    "cog_exec": "Cognitive",
    "lang_comm": "Cognitive",
    "found_knowl": "Cognitive",
    "soc_emot": "Social",
    "ind_lifeskills": "Social",
    "expl_creat": "Creative",
    "health": "Motor"
}

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent.parent

CANDIDATE_DB_PATHS = [
    PACKAGE_DIR / "poi.db",
    PROJECT_ROOT / "spark" / "data" / "poi.db",
    PROJECT_ROOT / "spark" / "poi.db",
    PROJECT_ROOT / "poi.db"
]


class SparkDataError(ValueError):
    """Domain data exception carrying an error code and HTTP status code."""
    def __init__(self, message: str, code: str = "DATA_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


# Backward compatibility alias
SparkAPIError = SparkDataError


def get_db_path(custom_path: Optional[str] = None) -> Path:
    """Resolves the active SQLite database path."""
    if custom_path and Path(custom_path).exists():
        return Path(custom_path)
    for p in CANDIDATE_DB_PATHS:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"Could not locate SQLite database at any of: {[str(p) for p in CANDIDATE_DB_PATHS]}"
    )


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Opens a SQLite connection with Row factory enabled."""
    path = get_db_path(db_path)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def load_data_from_sqlite(db_path: Optional[str] = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Loads relational tables from SQLite.
    
    Returns:
        (pois_df, category_activities_df, activity_scores_df, age_weights_df)
    """
    path = get_db_path(db_path)
    conn = sqlite3.connect(str(path))
    try:
        pois = pd.read_sql_query("SELECT * FROM pois", conn)
        category_activities = pd.read_sql_query("SELECT * FROM poi_activities", conn)
        activity_scores = pd.read_sql_query("SELECT * FROM activity_points", conn)
        age_weights = pd.read_sql_query("SELECT * FROM age_points", conn)
    finally:
        conn.close()

    # Standard WGS84 coordinates (verified clean in poi.db)
    pois["latitude"] = pois["latitude"].astype(float)
    pois["longitude"] = pois["longitude"].astype(float)
    # Backward compatibility aliases
    pois["real_lat"] = pois["latitude"]
    pois["real_lon"] = pois["longitude"]

    # Deterministic display name for unnamed OSM venues
    def format_name(row):
        val = row["name"]
        if pd.isna(val) or not str(val).strip() or str(val).strip() in ("None", "nan"):
            type_title = str(row["type"]).replace("_", " ").title()
            return f"{type_title} (Site #{int(row['id']) % 1000})"
        return str(val).strip()

    pois["name"] = pois.apply(format_name, axis=1)

    return pois, category_activities, activity_scores, age_weights


def get_age_weights(age_weights_df: pd.DataFrame, child_age: float) -> np.ndarray:
    """Extracts and normalizes the 8D developmental factor weights for the child's age."""
    if child_age is None or child_age < 0 or child_age > 18:
        raise SparkDataError("No age band matches child_age.", code="NO_AGE_BAND", status_code=400)

    profile = age_weights_df.loc[
        (age_weights_df["min_age"] <= child_age) & 
        ((age_weights_df["max_age"] > child_age) | (child_age >= 18.0))
    ]
    if len(profile) == 0:
        raise SparkDataError("No age band matches child_age.", code="NO_AGE_BAND", status_code=400)

    weights = profile.iloc[0][FACTORS].astype(float).to_numpy()
    if (weights < 0).any() or weights.sum() <= 0:
        raise SparkDataError("Age weights must be non-negative with a positive sum.", code="INVALID_AGE_WEIGHTS", status_code=500)
    
    weights = weights / weights.sum()
    return weights


def get_all_pois_with_activities(db_path: Optional[str] = None, child_age: float = 5.0) -> List[Dict[str, Any]]:
    """Returns all verified POIs enriched with their activities, scores, and primary domains."""
    pois_df, cat_acts_df, act_scores_df, age_weights_df = load_data_from_sqlite(db_path)

    try:
        w = get_age_weights(age_weights_df, child_age)
    except SparkDataError:
        w = np.ones(len(FACTORS)) / len(FACTORS)

    # Relational join across pois, activities, and pediatric factor points
    merged = pois_df.merge(cat_acts_df, left_on="type", right_on="poi_type", how="inner")
    merged = merged.merge(act_scores_df, on="activity", how="inner")

    result = []
    for poi_id, group in merged.groupby("id"):
        row = group.iloc[0]
        activities = []
        domain_votes = {"Motor": 0, "Cognitive": 0, "Social": 0, "Creative": 0}
        
        factor_scores_sum = np.zeros(len(FACTORS))
        for _, act_row in group.iterrows():
            act_vec = act_row[FACTORS].to_numpy(dtype=float)
            factor_scores_sum += act_vec
            weighted_score = np.dot(w, (act_vec - 1) / 9.0)
            score_out_of_10 = round(float(weighted_score * 9.0 + 1.0), 1)
            activities.append(f"{act_row['activity']} ({score_out_of_10})")

            best_factor = FACTORS[int(np.argmax(act_vec))]
            best_domain = DOMAIN_MAPPING.get(best_factor, "Motor")
            domain_votes[best_domain] += 1

        primary_domain = max(domain_votes.keys(), key=lambda d: domain_votes[d])
        avg_factors = factor_scores_sum / max(1, len(group))
        composite_score = round(float(np.dot(w, avg_factors)), 1)

        result.append({
            "id": int(row["id"]),
            "name": str(row["name"]),
            "type": str(row["type"]),
            "lat": float(row["latitude"]),
            "lon": float(row["longitude"]),
            "domain": primary_domain,
            "score": composite_score,
            "dev_fit": composite_score,
            "age_fit": composite_score,
            "pref_fit": 8.0,
            "duration": 50,
            "cost": "$0",
            "age_range": "2-12",
            "is_named": not ("Site #" in str(row["name"])),
            "activities": activities,
            "factor_scores": {f: round(float(avg_factors[i]), 1) for i, f in enumerate(FACTORS)}
        })

    return sorted(result, key=lambda p: p["score"], reverse=True)

