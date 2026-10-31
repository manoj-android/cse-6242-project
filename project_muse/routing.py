"""Greedy + 2-opt routing for SPARK (simplified spec, Section 6.2).

No solver dependency. The route is a one-way outing starting at the
caregiver's start point; no return leg is counted, which matches the
timeline view. Total time is travel + dwell and must fit the budget.
"""

from geo import travel_mins
from scoring import DOMAIN_DISCOUNTS, dominant_domain_name, poi_vector, route_value


def _point(poi_or_start):
    return (float(poi_or_start["lat"]), float(poi_or_start["lon"]))


def _route_time(order, start):
    """Total minutes (travel + dwell) for an ordered list of POIs."""
    total = 0.0
    current = _point(start)
    for poi in order:
        total += travel_mins(current, _point(poi)) + float(poi["dwell_mins"])
        current = _point(poi)
    return total


def _two_opt(order, start, budget_mins):
    """Try every pair swap; keep it only if total time falls."""
    best = list(order)
    best_time = _route_time(best, start)
    improved = True
    rounds = 0
    while improved and rounds < 10:
        improved = False
        rounds += 1
        for i in range(len(best)):
            for j in range(i + 1, len(best)):
                candidate = list(best)
                candidate[i], candidate[j] = candidate[j], candidate[i]
                candidate_time = _route_time(candidate, start)
                if candidate_time < best_time - 1e-9 and candidate_time <= budget_mins:
                    best, best_time = candidate, candidate_time
                    improved = True
    return best


def greedy_route(start, scored_pois, budget_mins, max_stops=3):
    """Pick the best discounted POI that fits, repeatedly, then 2-opt.

    ``scored_pois`` are dicts with score, dwell_mins, lat/lon and
    dominant_domain (from scoring.score_pois). Returns the ordered
    list of chosen POIs (dicts, unchanged).
    """
    remaining = float(budget_mins)
    current = _point(start)
    visited = set()
    counts = {}
    chosen = []
    while len(chosen) < int(max_stops):
        best = None
        best_key = None
        best_travel = None
        for poi in scored_pois:
            if poi["id"] in visited:
                continue
            travel = travel_mins(current, _point(poi))
            cost = travel + float(poi["dwell_mins"])
            if cost > remaining:
                continue
            domain = poi.get("dominant_domain") or dominant_domain_name(poi_vector(poi))
            seen = counts.get(domain, 0)
            discount = DOMAIN_DISCOUNTS[min(seen, len(DOMAIN_DISCOUNTS) - 1)]
            contribution = discount * float(poi["score"])
            # Highest contribution wins; ties go to less travel, then lower id.
            key = (contribution, -travel, -int(poi["id"]))
            if best_key is None or key > best_key:
                best, best_key, best_travel = poi, key, travel
        if best is None:
            break
        chosen.append(best)
        visited.add(best["id"])
        domain = best.get("dominant_domain") or dominant_domain_name(poi_vector(best))
        counts[domain] = counts.get(domain, 0) + 1
        remaining -= best_travel + float(best["dwell_mins"])
        current = _point(best)
    return _two_opt(chosen, start, budget_mins)


def baseline_route(start, scored_pois, budget_mins, max_stops=3):
    """Nearest-first route, scored with the same formula, for comparison."""
    remaining = float(budget_mins)
    current = _point(start)
    visited = set()
    chosen = []
    while len(chosen) < int(max_stops):
        best = None
        best_travel = None
        for poi in scored_pois:
            if poi["id"] in visited:
                continue
            travel = travel_mins(current, _point(poi))
            if travel + float(poi["dwell_mins"]) > remaining:
                continue
            if best_travel is None or travel < best_travel:
                best, best_travel = poi, travel
        if best is None:
            break
        chosen.append(best)
        visited.add(best["id"])
        remaining -= best_travel + float(best["dwell_mins"])
        current = _point(best)
    return chosen


def route_with_arrivals(start, ordered_pois):
    """Annotate a route with travel/arrival times, in visit order."""
    stops = []
    current = _point(start)
    clock = 0.0
    for poi in ordered_pois:
        travel = travel_mins(current, _point(poi))
        clock += travel
        stops.append({
            **poi,
            "travel_mins": round(travel, 1),
            "arrival_mins": round(clock, 1),
            "departure_mins": round(clock + float(poi["dwell_mins"]), 1),
        })
        clock += float(poi["dwell_mins"])
        current = _point(poi)
    return stops


def route_totals(start, ordered_pois):
    """Totals for a route, including its discounted route value."""
    stops = route_with_arrivals(start, ordered_pois)
    travel = sum(s["travel_mins"] for s in stops)
    dwell = sum(float(s["dwell_mins"]) for s in stops)
    domains = sorted({s.get("dominant_domain") or dominant_domain_name(poi_vector(s)) for s in stops})
    return {
        "total_mins": round(travel + dwell, 1),
        "travel_mins": round(travel, 1),
        "dwell_mins": round(dwell, 1),
        "domains_covered": len(domains),
        "domain_list": domains,
        "route_value": round(route_value(ordered_pois), 3),
        "stops": len(stops),
    }
