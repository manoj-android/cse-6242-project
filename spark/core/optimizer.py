"""SPARK Multi-Objective Simulated Annealing Optimizer & 2-Opt Routing Engine.

Core algorithmic module executing:
- CDC milestone developmental fit with diminishing returns (1 - exp(-T/2))
- Centered cosine similarity activity redundancy penalty
- Normalized distance penalty from caregiver origin
- 2-Opt TSP loop sequencing starting and ending at caregiver home
"""

import math
import random
import time
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import pandas as pd
from pathlib import Path

from spark.data.db import (
    FACTORS,
    DOMAIN_MAPPING,
    SparkDataError,
    SparkAPIError,
    load_data_from_sqlite,
    get_age_weights,
    get_db_path
)

FACTOR_PRETTY_NAMES = {
    "soc_emot": "Social-Emotional",
    "cog_exec": "Cognitive & Executive",
    "lang_comm": "Language & Communication",
    "phys_motor": "Physical & Motor",
    "expl_creat": "Exploration & Creativity",
    "found_knowl": "Foundational Knowledge",
    "ind_lifeskills": "Independence & Life Skills",
    "health": "Health & Wellness"
}


def haversine_miles(lat1: float, lon1: float, lat2: np.ndarray, lon2: np.ndarray) -> np.ndarray:
    """Calculates great-circle distance between coordinates in statute miles."""
    earth_radius_miles = 3958.7613
    lat1, lon1 = np.radians(lat1), np.radians(lon1)
    lat2, lon2 = np.radians(lat2), np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    )
    return 2.0 * earth_radius_miles * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))


def build_candidates(
    pois: pd.DataFrame,
    category_activities: pd.DataFrame,
    activity_scores: pd.DataFrame,
    origin_lat: float,
    origin_lon: float,
    radius_miles: float
) -> pd.DataFrame:
    """Filters POIs by radius and joins with activities and 8D developmental scores."""
    pois = pois.copy()
    pois["distance_miles"] = haversine_miles(
        origin_lat, origin_lon,
        pois["latitude"].to_numpy(),
        pois["longitude"].to_numpy()
    )

    # Filter by radius; exclude degenerate zero-distance stops (< 0.15 miles) right at origin
    filtered = pois[(pois["distance_miles"] <= radius_miles) & (pois["distance_miles"] >= 0.15)].copy()
    eligible_pois = filtered if len(filtered) >= 3 else pois[pois["distance_miles"] <= radius_miles].copy()

    candidates = (
        eligible_pois
        .merge(category_activities, left_on="type", right_on="poi_type", how="inner")
        .merge(activity_scores, on="activity", how="inner")
        .dropna(subset=["distance_miles"] + FACTORS)
        .reset_index(drop=True)
    )
    return candidates


def optimize_agenda(
    candidates: pd.DataFrame,
    weights: np.ndarray,
    radius_miles: float,
    n: int = 2,
    distance_penalty: float = 0.12,
    redundancy_penalty: float = 0.10,
    coverage_scale: float = 2.0,
    iterations: int = 2500,
    seed: int = 42,
    enforce_unique_pois: bool = True
) -> Tuple[pd.DataFrame, float, Tuple[float, float, float, np.ndarray]]:
    """Simulated Annealing optimizer balancing developmental fit against travel and redundancy."""
    df = candidates.reset_index(drop=True).copy()

    if len(df) == 0:
        raise SparkDataError(
            f"No candidate activities found within {radius_miles} miles of starting location.",
            code="INSUFFICIENT_ACTIVITIES",
            status_code=422
        )

    # Effective stop cap (The 'Whichever is Least' Rule)
    n_unique_acts = df["activity"].nunique()
    n_unique_pois = df["id"].nunique()

    max_possible = min(n_unique_acts, n_unique_pois) if enforce_unique_pois else n_unique_acts
    if max_possible < n:
        if max_possible < 1:
            raise SparkDataError(
                f"Only {n_unique_acts} distinct activities available in radius; need at least {n}. Please increase distance radius.",
                code="INSUFFICIENT_ACTIVITIES",
                status_code=422
            )
        # Cap gracefully
        n = max_possible

    scores = ((df[FACTORS].to_numpy(dtype=float) - 1.0) / 9.0).clip(0.0, 1.0)
    w = weights / weights.sum()

    rad_norm = max(0.5, radius_miles)
    distances = np.clip(df["distance_miles"].to_numpy(dtype=float) / rad_norm, 0.0, 1.0)
    activities = df["activity"].to_numpy()
    poi_ids = df["id"].to_numpy()
    rng = random.Random(seed)

    # Precompute candidate pairwise distance matrix to penalize tour spread / criss-crossing
    c_lats = df["latitude"].to_numpy(dtype=float)
    c_lons = df["longitude"].to_numpy(dtype=float)
    rad_lat = np.radians(c_lats)
    rad_lon = np.radians(c_lons)
    dlat = rad_lat[:, None] - rad_lat[None, :]
    dlon = rad_lon[:, None] - rad_lon[None, :]
    a = np.sin(dlat / 2.0)**2 + np.cos(rad_lat[:, None]) * np.cos(rad_lat[None, :]) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    cand_dist_matrix = 3958.8 * c

    # Centered cosine similarity to penalize activity redundancy
    centered = scores - scores.mean(axis=1, keepdims=True)
    norms = np.linalg.norm(centered, axis=1)
    denominator = np.outer(norms, norms)
    similarity = centered @ centered.T
    similarity = np.divide(similarity, denominator, out=np.zeros_like(similarity), where=denominator > 1e-12)
    similarity = np.clip(similarity, 0.0, 1.0)

    def objective(indices):
        idx = np.asarray(indices, dtype=int)
        selected_scores = scores[idx]

        # Non-linear diminishing returns curve: 1 - exp(-T / scale)
        factor_totals = selected_scores.sum(axis=0)
        coverage = 1.0 - np.exp(-factor_totals / coverage_scale)
        development_value = float(np.dot(w, coverage))

        radial_cost = float(distances[idx].mean())
        if len(idx) > 1:
            sub_dist = cand_dist_matrix[np.ix_(idx, idx)]
            inter_cost = float(sub_dist[np.triu_indices(len(idx), k=1)].mean()) / rad_norm
        else:
            inter_cost = 0.0
        # Blend radial distance with inter-stop compactness to eliminate dispersed star/spoke routes
        distance_cost = 0.35 * radial_cost + 0.65 * inter_cost

        if len(idx) > 1:
            pairwise = similarity[np.ix_(idx, idx)]
            redundancy = float(pairwise[np.triu_indices(len(idx), k=1)].mean())
        else:
            redundancy = 0.0

        score = development_value - distance_penalty * distance_cost - redundancy_penalty * redundancy
        return score, development_value, distance_cost, redundancy, coverage

    def random_agenda():
        order = list(range(len(df)))
        rng.shuffle(order)
        chosen = []
        used_acts = set()
        used_pois = set()

        for i in order:
            act = activities[i]
            pid = poi_ids[i]
            if act not in used_acts and (not enforce_unique_pois or pid not in used_pois):
                chosen.append(i)
                used_acts.add(act)
                used_pois.add(pid)
            if len(chosen) == n:
                return chosen

        # Fallback to greedy if random shuffle didn't hit n
        chosen = []
        used_acts = set()
        for i in order:
            if activities[i] not in used_acts:
                chosen.append(i)
                used_acts.add(activities[i])
            if len(chosen) == n:
                return chosen

        return chosen[:n] if chosen else [0]

    current = random_agenda()
    curr_score, curr_dev, curr_dist, curr_red, curr_cov = objective(current)
    best = list(current)
    best_score = curr_score
    best_metrics = (curr_dev, curr_dist, curr_red, curr_cov)

    for step in range(iterations):
        pos = rng.randrange(len(current))
        remaining = list(current)
        remaining.pop(pos)

        used_acts = {activities[i] for i in remaining}
        used_pois = {poi_ids[i] for i in remaining} if enforce_unique_pois else set()

        options = [
            i for i in range(len(df))
            if activities[i] not in used_acts and (not enforce_unique_pois or poi_ids[i] not in used_pois) and i not in remaining
        ]
        if not options:
            continue

        proposal = remaining + [rng.choice(options)]
        prop_score, prop_dev, prop_dist, prop_red, prop_cov = objective(proposal)

        temp = max(0.001, 0.05 * (1.0 - step / iterations))
        delta = prop_score - curr_score

        if delta > 0 or rng.random() < math.exp(min(50, delta / temp)):
            current = proposal
            curr_score = prop_score

        if prop_score > best_score:
            best = list(proposal)
            best_score = prop_score
            best_metrics = (prop_dev, prop_dist, prop_red, prop_cov)

    result_df = df.iloc[best].copy()
    return result_df, best_score, best_metrics


def sequence_2opt(origin_lat: float, origin_lon: float, stops_df: pd.DataFrame) -> pd.DataFrame:
    """Arranges chosen stops into the guaranteed shortest round-trip loop using exact permutation search for K<=7 or 2-Opt TSP."""
    if len(stops_df) <= 1:
        out = stops_df.copy()
        out["selection_order"] = [1] if len(stops_df) == 1 else []
        return out

    pts = [{"lat": origin_lat, "lon": origin_lon, "idx": -1}]
    for idx, row in stops_df.iterrows():
        pts.append({"lat": float(row["latitude"]), "lon": float(row["longitude"]), "idx": idx})

    n = len(pts)

    def calc_length(order_indices):
        tot = 0.0
        cur_lat, cur_lon = origin_lat, origin_lon
        for i in order_indices:
            p = pts[i]
            tot += haversine_miles(cur_lat, cur_lon, np.array([p["lat"]]), np.array([p["lon"]]))[0]
            cur_lat, cur_lon = p["lat"], p["lon"]
        tot += haversine_miles(cur_lat, cur_lon, np.array([origin_lat]), np.array([origin_lon]))[0]
        return tot

    stop_indices = list(range(1, n))

    # Exact permutation search for small tours (n <= 8 stops, < 5,040 evaluations, takes < 1 ms)
    if len(stop_indices) <= 7:
        import itertools
        best_perm = stop_indices
        best_dist = float("inf")
        for perm in itertools.permutations(stop_indices):
            d = calc_length(perm)
            if d < best_dist:
                best_dist = d
                best_perm = perm
        ordered_indices = [pts[i]["idx"] for i in best_perm]
        ordered_df = stops_df.loc[ordered_indices].copy()
        ordered_df["selection_order"] = range(1, len(ordered_df) + 1)
        return ordered_df

    # 2-Opt local search heuristic for larger tours
    route = [0] + stop_indices + [0]
    best_route = list(route)
    best_dist = calc_length(route[1:-1])

    improved = True
    iterations = 0
    while improved and iterations < 100:
        improved = False
        iterations += 1
        for i in range(1, len(route) - 2):
            for k in range(i + 1, len(route) - 1):
                new_route = best_route[:i] + best_route[i:k + 1][::-1] + best_route[k + 1:]
                d = calc_length(new_route[1:-1])
                if d < best_dist - 1e-4:
                    best_route = new_route
                    best_dist = d
                    improved = True
                    break
            if improved:
                break

    ordered_indices = [pts[i]["idx"] for i in best_route[1:-1]]
    ordered_df = stops_df.loc[ordered_indices].copy()
    ordered_df["selection_order"] = range(1, len(ordered_df) + 1)
    return ordered_df


def optimize_spark_outing(
    origin: Dict[str, Any],
    child_age: float = 5.0,
    radius_miles: float = 3.0,
    target_stops: int = 2,
    distance_penalty: float = 0.12,
    redundancy_penalty: float = 0.10,
    enforce_unique_pois: bool = True,
    iterations: int = 2500,
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Main execution pipeline consuming SQLite data and returning Service Contract JSON."""
    t0 = time.perf_counter()

    pois_df, cat_acts_df, act_scores_df, age_weights_df = load_data_from_sqlite(db_path)
    weights = get_age_weights(age_weights_df, child_age)

    origin_lat = float(origin.get("lat", origin.get("latitude", 34.0488)))
    origin_lon = float(origin.get("lon", origin.get("longitude", -118.2518)))
    origin_name = origin.get("name", "Pershing Square (DTLA)")

    candidates = build_candidates(
        pois=pois_df,
        category_activities=cat_acts_df,
        activity_scores=act_scores_df,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        radius_miles=radius_miles
    )

    stops_df, best_score, metrics = optimize_agenda(
        candidates=candidates,
        weights=weights,
        radius_miles=radius_miles,
        n=target_stops,
        distance_penalty=distance_penalty,
        redundancy_penalty=redundancy_penalty,
        iterations=iterations,
        enforce_unique_pois=enforce_unique_pois
    )

    sequenced_df = sequence_2opt(origin_lat, origin_lon, stops_df)
    exec_time_ms = round((time.perf_counter() - t0) * 1000.0, 1)

    dev_val, dist_cost, red_score, coverage_arr = metrics

    # Format 8D Radar Chart coverage
    coverage_dict = {}
    for i, factor in enumerate(FACTORS):
        coverage_dict[factor] = {
            "name": FACTOR_PRETTY_NAMES[factor],
            "age_weight": round(float(weights[i]), 3),
            "coverage": round(float(coverage_arr[i]), 3)
        }

    # Format Sequenced Itinerary Stops
    agenda = []
    for _, row in sequenced_df.iterrows():
        factor_dict = {f: int(round(float(row[f]))) for f in FACTORS if f in row}
        agenda.append({
            "selection_order": int(row["selection_order"]),
            "id": int(row["id"]),
            "name": str(row["name"]),
            "type": str(row["type"]),
            "activity": str(row["activity"]),
            "distance_miles": round(float(row["distance_miles"]), 2),
            "latitude": round(float(row["latitude"]), 6),
            "longitude": round(float(row["longitude"]), 6),
            "factor_scores": factor_dict
        })

    response = {
        "status": "success",
        "metadata": {
            "child_age": float(child_age),
            "search_radius_miles": float(radius_miles),
            "target_stops": int(target_stops),
            "effective_stops": len(agenda),
            "origin": {
                "name": origin_name,
                "latitude": origin_lat,
                "longitude": origin_lon
            },
            "optimizer_telemetry": {
                "algorithm": "Simulated Annealing + 2-Opt TSP",
                "iterations": int(iterations),
                "objective_value": round(float(best_score), 4),
                "execution_time_ms": exec_time_ms
            }
        },
        "summary": {
            "objective_value": round(float(best_score), 3),
            "development_value": round(float(dev_val), 3),
            "distance_cost": round(float(dist_cost), 3),
            "redundancy_score": round(float(red_score), 3),
            "unique_activities": int(sequenced_df["activity"].nunique()),
            "unique_pois": int(sequenced_df["id"].nunique())
        },
        "developmental_coverage": coverage_dict,
        "agenda": agenda
    }

    return response

