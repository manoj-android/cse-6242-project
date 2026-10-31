"""Unit tests for the simplified spec's worked examples (spec Section 9).

Run:  python3 -m unittest discover -s tests -v
Only the standard library is used.
"""

import csv
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from export_from_poi_db import average_activity_vector, scale_for_age
from geo import haversine_miles, travel_mins
from import_pois import import_csv
from routing import baseline_route, greedy_route, route_totals
from scoring import age_fit, cosine_similarity, route_value, score_poi, travel_penalty

PROFILE = [0.2, 0.9, 0.8, 0.1]
PLAYGROUND = {"cog": 0.15, "phy": 0.95, "soc": 0.85, "emo": 0.70,
              "min_age": 3, "max_age": 8}
LIBRARY = {"cog": 0.95, "phy": 0.10, "soc": 0.40, "emo": 0.60,
           "min_age": 4, "max_age": 10}


def _poi(poi_id, lat, lon, score, domain, dwell=45, category="park"):
    return {"id": poi_id, "name": f"POI {poi_id}", "category": category,
            "lat": lat, "lon": lon, "min_age": 0, "max_age": 18,
            "dwell_mins": dwell, "cost": "free",
            "cog": 0.5, "phy": 0.5, "soc": 0.5, "emo": 0.5,
            "score": score, "dominant_domain": domain,
            "fit": score, "age_fit": 1.0, "penalty": 0.0}


class TestScoring(unittest.TestCase):
    def test_cosine_worked_example(self):
        # Corrected values: the deep spec printed 0.952 / 0.384, which is wrong.
        self.assertAlmostEqual(
            cosine_similarity(PROFILE, [0.15, 0.95, 0.85, 0.70]), 0.913, places=3)
        self.assertAlmostEqual(
            cosine_similarity(PROFILE, [0.95, 0.10, 0.40, 0.60]), 0.450, places=3)

    def test_score_worked_example(self):
        playground = score_poi(PROFILE, PLAYGROUND, 5, 12)
        self.assertAlmostEqual(playground["score"], 0.939, places=3)
        library = score_poi(PROFILE, LIBRARY, 5, 25)
        self.assertAlmostEqual(library["score"], 0.515, places=3)

    def test_age_fit(self):
        self.assertEqual(age_fit(5, 3, 8), 1.0)
        self.assertEqual(age_fit(5, 7, 12), 0.5)
        self.assertEqual(age_fit(5, 9, 12), 0.0)

    def test_travel_penalty(self):
        self.assertEqual(travel_penalty(8), 0.0)
        self.assertEqual(travel_penalty(15), 0.0)
        self.assertAlmostEqual(travel_penalty(25), 0.10)
        self.assertEqual(travel_penalty(100), 0.20)

    def test_zero_profile_falls_back_to_balanced(self):
        result = score_poi([0, 0, 0, 0], PLAYGROUND, 5, 0)
        self.assertGreater(result["fit"], 0)


class TestGeo(unittest.TestCase):
    def test_grand_park_to_central_library(self):
        # ~0.67 miles straight-line, ~4.5 min at 22 mph + buffer (spec 6.1).
        mins = travel_mins((34.0560, -118.2458), (34.0507, -118.2557))
        self.assertAlmostEqual(mins, 4.5, delta=1.0)
        self.assertAlmostEqual(haversine_miles((34.0560, -118.2458), (34.0507, -118.2557)),
                               0.67, delta=0.05)


class TestRouting(unittest.TestCase):
    def test_route_respects_budget_and_never_repeats(self):
        start = {"lat": 34.0560, "lon": -118.2458}
        pois = [_poi(1, 34.0565, -118.2460, 0.9, "phy"),
                _poi(2, 34.0570, -118.2470, 0.8, "cog"),
                _poi(3, 34.0580, -118.2480, 0.7, "soc")]
        route = greedy_route(start, pois, 60, 3)
        self.assertLessEqual(route_totals(start, route)["total_mins"], 60)
        self.assertEqual(len({p["id"] for p in route}), len(route))

    def test_diminishing_returns_prefer_variety(self):
        same = [_poi(i, 34.0560, -118.2458, 0.8, "phy") for i in (1, 2, 3)]
        mixed = [_poi(1, 34.0560, -118.2458, 0.8, "phy"),
                 _poi(2, 34.0560, -118.2458, 0.8, "cog"),
                 _poi(3, 34.0560, -118.2458, 0.8, "soc")]
        self.assertGreater(route_value(mixed), route_value(same))

    def test_baseline_runs(self):
        start = {"lat": 34.0560, "lon": -118.2458}
        pois = [_poi(1, 34.0565, -118.2460, 0.9, "phy")]
        self.assertEqual(len(baseline_route(start, pois, 120, 3)), 1)


class TestExportHelpers(unittest.TestCase):
    def test_age_scaling_playground_age_5(self):
        activity_points = {
            "free play": {"soc_emot": 7, "cog_exec": 8, "lang_comm": 7, "phys_motor": 7,
                          "expl_creat": 10, "found_knowl": 6, "ind_lifeskills": 9, "health": 7}
        }
        avg = average_activity_vector(["free play"], activity_points)
        age_row = {"soc_emot": 9, "cog_exec": 8, "lang_comm": 9, "phys_motor": 8,
                   "expl_creat": 9, "found_knowl": 7, "ind_lifeskills": 7, "health": 7}
        vec = scale_for_age(avg, age_row)
        self.assertAlmostEqual(vec["emo"], 0.9, places=3)
        self.assertAlmostEqual(vec["cog"], 0.53, places=2)


class TestImportValidation(unittest.TestCase):
    def test_swapped_coordinates_are_rejected_not_fixed(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "pois.csv"
            db_path = Path(tmp) / "test.db"
            with open(csv_path, "w", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(["id", "name", "category", "latitude", "longitude",
                                 "min_age", "max_age", "dwell_mins",
                                 "cog", "phy", "soc", "emo"])
                # Swapped: latitude column holds -118, longitude holds 34.
                writer.writerow([1, "Swapped Park", "park", -118.25, 34.05, 0, 12, 45, 0.5, 0.5, 0.5, 0.5])
                writer.writerow([2, "Good Park", "park", 34.05, -118.25, 0, 12, 45, 0.5, 0.5, 0.5, 0.5])
            imported, rejected = import_csv(str(csv_path), str(db_path))
            self.assertEqual(imported, 1)
            self.assertEqual(len(rejected), 1)
            conn = sqlite3.connect(db_path)
            names = [r[0] for r in conn.execute("SELECT name FROM pois")]
            conn.close()
            self.assertEqual(names, ["Good Park"])


if __name__ == "__main__":
    unittest.main()
