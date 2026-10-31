# SPARK — starter code (simplified spec)

Personalized activity routes for kids, from the supplied LA dataset
(`poi__2.db`, 484 places). See `../your_files/spark-simplified-tech-spec.md`
for the full simplified specification.

## What is here

| File | Purpose |
|---|---|
| `scoring.py` | Cosine fit, age fit, travel penalty, final score, route value, coverage. Stdlib only. |
| `geo.py` | Haversine travel-time estimate, Downtown LA box, swapped-coordinate check. |
| `routing.py` | Greedy + 2-opt route and nearest-first baseline. |
| `import_pois.py` | CSV → `spark.db` with coordinate validation (for a curated CSV, if you add one). |
| `export_from_poi_db.py` | The real-data path: reads `poi__2.db` read-only, corrects swapped coordinates, averages activities, scales by age band, writes `spark.db` and `webapp/data/dtla_pois.json`. |
| `app.py` | Flask API: `GET /api/pois`, `POST /api/plan`, serves `webapp/`. |
| `demo.py` | One plan on the command line, no Flask needed. |
| `webapp/` | Rendered page: Leaflet map + D3 fit panel + itinerary timeline. Mirrors the Python formulas in `app.js`. |
| `tests/test_spark.py` | 11 stdlib unit tests, including the corrected cosine example. |

## Run it

```bash
cd spark
python3 export_from_poi_db.py --source ~/workspace/user/files/poi__2.db
python3 -m unittest discover -s tests -v   # 11 tests, should all pass
python3 demo.py
pip install flask
python3 app.py                              # open http://127.0.0.1:5000/
```

Static-only mode (no Flask, precomputed data):

```bash
cd webapp && python3 -m http.server 8080    # open http://127.0.0.1:8080/
```

## Data honesty notes (also shown on the page)

- Coordinates in `poi__2.db` are swapped (latitude column holds −118…, longitude holds 34…). They are corrected in `export_from_poi_db.py` and validated against central LA. Never use the raw columns as lat/lon.
- 419 of 484 places are unnamed; they are kept with fallback names. Only 65 have names.
- Scores collapse to 9 distinct 4-domain vectors because scoring is by place type. Park/garden and sports centre/fitness centre share vectors. Places of the same type differ only by travel time.
- Dog parks (free play) and outdoor seating (picknick) use documented fallback activities; 15 places.
- Dwell times and costs are assumptions by category. `op_hours` holds OSM tags, not opening hours, and is ignored.
- Travel times are Haversine estimates (22 mph, ×1.35 circuity, +2 min), not live routing.
- The dataset has no per-place age range, so age is carried by age-scaled vectors (`vectors_by_age` in the JSON, one per age band). `scoring.age_fit()` returns 1.0 for this dataset.

## Next steps

1. Verify a handful of coordinates and names on a map before presenting them as real.
2. Build out `webapp/` if you want the Flask page to differ from the static page.
3. OR-Tools is a stretch only; do not attempt it until the greedy route demos end to end.
