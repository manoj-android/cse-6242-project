"""SPARK evaluation scenarios (simplified spec, Section 9 / Phase 4).

Reproduces the three saved scenarios for the report/demo without Flask:

  A: 60 min, physical+social, from Pershing Square
     (spec names Union Station, which is NOT an implemented start point
     in app.py / webapp/app.js -- Pershing Square is the nearest
     implemented downtown start; add Union Station before quoting A
     as a Union Station result)
  B: 120 min, balanced, from Grand Park
  C: 120 min, cognitive-heavy, from Grand Park
     (the code has no separate travel-tolerance knob: the penalty is
     fixed at 0 for the first 15 min, then 0.01/min capped at 0.20,
     so "low travel tolerance" here is read from the travel share,
     not a separate input)

Usage:  python3 eval_scenarios.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from app import START_POINTS, load_pois
from geo import travel_mins
from routing import baseline_route, greedy_route, route_totals
from scoring import score_pois

STARTS = {s["label"]: s for s in START_POINTS}
SCENARIOS = [
    ("A", "60 min, physical+social, Pershing Square",
     [0.2, 0.9, 0.8, 0.1], 5, STARTS["Pershing Square"], 60),
    ("B", "120 min, balanced, Grand Park",
     [0.5, 0.5, 0.5, 0.5], 5, STARTS["Grand Park"], 120),
    ("C", "120 min, cognitive-heavy, Grand Park",
     [0.9, 0.2, 0.3, 0.2], 5, STARTS["Grand Park"], 120),
]


def describe(totals, route):
    stops = " > ".join(f"{s['name']} ({s['category']}, {s['dwell_mins']}m)"
                       for s in route) or "(none)"
    share = round(100 * totals["travel_mins"] / totals["total_mins"], 1) \
        if totals["total_mins"] else 0
    per_hour = round(totals["route_value"] / (totals["total_mins"] / 60), 3) \
        if totals["total_mins"] else 0
    return (f"total={totals['total_mins']} travel={totals['travel_mins']} "
            f"({share}%) dwell={totals['dwell_mins']} stops={totals['stops']} "
            f"domains={totals['domains_covered']} {totals['domain_list']} "
            f"value={totals['route_value']} value/hr={per_hour}\n"
            f"  stops: {stops}")


def main():
    pois = load_pois(Path(__file__).parent / "spark.db")
    for key, desc, profile, age, start, budget in SCENARIOS:
        travel = {p["id"]: travel_mins((start["lat"], start["lon"]),
                                       (p["lat"], p["lon"])) for p in pois}
        ranked = score_pois(profile, pois, age, travel)
        route = greedy_route(start, ranked, budget, 3)
        base = baseline_route(start, ranked, budget, 3)
        print(f"Scenario {key}: {desc}")
        print(f"  Optimized:\n  {describe(route_totals(start, route), route)}")
        print(f"  Baseline (nearest-first):\n"
              f"  {describe(route_totals(start, base), base)}")
        print(f"  Top ranked: {ranked[0]['name']} "
              f"score={ranked[0]['score']:.3f} ({ranked[0]['category']})\n")


if __name__ == "__main__":
    main()
