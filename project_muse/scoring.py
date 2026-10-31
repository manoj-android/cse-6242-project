"""Scoring for SPARK (simplified spec, Section 5).

Pure standard library. No NumPy is needed at this scale, which keeps
the starter runnable with ``python3`` alone. Flask is only needed
for ``app.py``.

All scores are in [0, 1]. Every intermediate part is returned so the
frontend breakdown chart can draw exactly what the server computed,
instead of re-deriving it in JavaScript.

Formula (spec Section 5.5)::

    score = 0.70 * fit + 0.30 * age_fit - penalty, clamped to [0, 1]

where ``fit`` is cosine similarity between the caregiver profile and
the POI vector, ``age_fit`` is 1 inside the age range and decays
outside it, and ``penalty`` is 0 for the first 15 travel minutes,
then 0.01 per minute, capped at 0.20.
"""

import math

DOMAINS = ("cog", "phy", "soc", "emo")
DOMAIN_LABELS = {
    "cog": "Cognitive",
    "phy": "Physical",
    "soc": "Social",
    "emo": "Emotional",
}

DEFAULT_PROFILE = [0.5, 0.5, 0.5, 0.5]

FIT_WEIGHT = 0.70
AGE_WEIGHT = 0.30

FREE_TRAVEL_MINS = 15.0
PENALTY_PER_MIN = 0.01
MAX_PENALTY = 0.20

# Diminishing returns for repeats of the same dominant domain in a
# route: 1st POI full value, 2nd half, 3rd and later a quarter.
DOMAIN_DISCOUNTS = (1.0, 0.5, 0.25)


def normalize_profile(profile):
    """Validate a 4-number profile and fall back to balanced if all zero.

    Returns a new list of floats. Raises ValueError on the wrong
    length or non-numeric / out-of-range values, so bad API input
    fails loudly instead of producing a silent nonsense ranking.
    """
    if profile is None:
        return list(DEFAULT_PROFILE)
    try:
        values = [float(v) for v in profile]
    except (TypeError, ValueError) as exc:
        raise ValueError("profile must be 4 numbers in [0, 1]") from exc
    if len(values) != 4:
        raise ValueError("profile must have exactly 4 values [cog, phy, soc, emo]")
    if any(math.isnan(v) or math.isinf(v) or v < 0 or v > 1 for v in values):
        raise ValueError("profile values must be in [0, 1]")
    if all(v == 0 for v in values):
        return list(DEFAULT_PROFILE)
    return values


def poi_vector(poi):
    """Return the POI's [cog, phy, soc, emo] vector as floats."""
    return [float(poi[domain]) for domain in DOMAINS]


def cosine_similarity(user_vector, poi_vector_):
    """Cosine similarity in [0, 1] for non-negative vectors.

    Returns 0.0 if either vector has zero length, instead of
    dividing by zero. Cosine (not a dot product) is used so a POI
    does not win just by having large numbers in every domain; it
    wins by pointing in the same direction as the caregiver asked for.
    """
    dot = sum(u * p for u, p in zip(user_vector, poi_vector_))
    user_norm = math.sqrt(sum(u * u for u in user_vector))
    poi_norm = math.sqrt(sum(p * p for p in poi_vector_))
    if user_norm == 0 or poi_norm == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (user_norm * poi_norm)))


def dominant_domain(vector):
    """Index of the largest domain value; first wins on a tie."""
    return max(range(len(vector)), key=lambda i: (vector[i], -i))


def dominant_domain_name(vector):
    return DOMAINS[dominant_domain(vector)]


def age_fit(child_age, min_age, max_age):
    """1.0 inside the age range, decaying 0.25 per year outside it."""
    age = float(child_age)
    if min_age <= age <= max_age:
        return 1.0
    years_outside = min_age - age if age < min_age else age - max_age
    return max(0.0, 1.0 - 0.25 * years_outside)


def travel_penalty(travel_mins):
    """0 for the first 15 minutes, then 0.01/min, capped at 0.20."""
    excess = max(0.0, float(travel_mins) - FREE_TRAVEL_MINS)
    return min(MAX_PENALTY, PENALTY_PER_MIN * excess)


def score_poi(profile, poi, child_age, travel_mins):
    """Score one POI. ``poi`` is a dict with cog/phy/soc/emo and ages.

    Returns a dict with every part, so callers (and the API) never
    have to recompute the breakdown.
    """
    profile = normalize_profile(profile)
    vector = poi_vector(poi)
    fit = cosine_similarity(profile, vector)
    fit_age = age_fit(child_age, poi["min_age"], poi["max_age"])
    penalty = travel_penalty(travel_mins)
    score = FIT_WEIGHT * fit + AGE_WEIGHT * fit_age - penalty
    return {
        "fit": fit,
        "age_fit": fit_age,
        "penalty": penalty,
        "fit_part": FIT_WEIGHT * fit,
        "age_part": AGE_WEIGHT * fit_age,
        "score": max(0.0, min(1.0, score)),
        "dominant_domain": DOMAINS[dominant_domain(vector)],
    }


def score_pois(profile, pois, child_age, travel_mins_by_id):
    """Score every POI and return them ranked best-first.

    ``travel_mins_by_id`` maps poi id -> minutes from the start
    point. Each returned dict is a copy of the POI plus the scoring
    parts from :func:`score_poi`. Ties keep the input order, so
    ranking is deterministic.
    """
    profile = normalize_profile(profile)
    scored = []
    for poi in pois:
        result = score_poi(
            profile, poi, child_age, travel_mins_by_id.get(poi["id"], 0.0)
        )
        scored.append({**poi, **result})
    scored.sort(key=lambda p: p["score"], reverse=True)
    return scored


def route_value(scored_pois_in_order):
    """Sum of discounted scores, rewarding domain variety (spec 5.6)."""
    counts = {}
    total = 0.0
    for poi in scored_pois_in_order:
        domain = poi.get("dominant_domain") or dominant_domain_name(
            poi_vector(poi)
        )
        seen = counts.get(domain, 0)
        discount = DOMAIN_DISCOUNTS[min(seen, len(DOMAIN_DISCOUNTS) - 1)]
        total += discount * float(poi["score"])
        counts[domain] = seen + 1
    return total


def coverage_vector(selected_pois):
    """Dwell-weighted mean of the selected POIs' vectors, or zeros.

    This is the route-coverage shape drawn on the radar chart next
    to the caregiver profile. Weighting by dwell time means a
    60-minute library visit shapes coverage more than a 15-minute
    stop, which matches how a caregiver experiences the outing.
    """
    if not selected_pois:
        return [0.0, 0.0, 0.0, 0.0]
    total_dwell = sum(float(p.get("dwell_mins", 0)) for p in selected_pois)
    if total_dwell <= 0:
        total_dwell = float(len(selected_pois))
        weights = [1.0] * len(selected_pois)
    else:
        weights = [float(p.get("dwell_mins", 0)) for p in selected_pois]
    coverage = [0.0, 0.0, 0.0, 0.0]
    for poi, weight in zip(selected_pois, weights):
        vector = poi_vector(poi)
        for i in range(4):
            coverage[i] += weight * vector[i]
    return [value / total_dwell for value in coverage]
