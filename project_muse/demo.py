"""Run one plan without Flask, to check the numbers by eye.

Usage (after exporting the real dataset)::

    python3 export_from_poi_db.py --source <path to poi__2.db>
    python3 demo.py
"""

from pathlib import Path

from app import START_POINTS, load_pois
from geo import travel_mins
from routing import baseline_route, greedy_route, route_totals
from scoring import score_pois


def main():
    start = START_POINTS[0]
    profile = [0.2, 0.9, 0.8, 0.1]
    child_age = 5
    budget = 120
    pois = load_pois(Path(__file__).parent / "spark.db")
    travel = {p["id"]: travel_mins((start["lat"], start["lon"]), (p["lat"], p["lon"])) for p in pois}
    ranked = score_pois(profile, pois, child_age, travel)
    print(f"{len(pois)} POIs loaded. Top 5 for profile {profile}, age {child_age}:")
    for poi in ranked[:5]:
        print(f"  {poi['score']:.3f}  {poi['name']} ({poi['category']}, "
              f"fit={poi['fit']:.3f}, penalty={poi['penalty']:.3f}, "
              f"travel={travel[poi['id']]:.1f} min)")
    route = greedy_route(start, ranked, budget, 3)
    print(f"\nRoute from {start['label']} ({budget} min budget): {route_totals(start, route)}")
    for stop in route:
        print(f"  - {stop['name']} ({stop['category']}, {stop['dwell_mins']} min)")
    base = baseline_route(start, ranked, budget, 3)
    print(f"Baseline (nearest first): {route_totals(start, base)}")


if __name__ == "__main__":
    main()
