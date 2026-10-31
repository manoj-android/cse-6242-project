"""Export enriched POIs from the supplied LA dataset (poi__2.db).

Source layout (read-only, never modified):
  pois(id, name, type, latitude, longitude, op_hours)
    * latitude holds longitude and longitude holds latitude:
      the columns are swapped in the source dump. Corrected here:
      real_lat = longitude column, real_lon = latitude column.
    * 419 of 484 rows have no name. They are kept, with a display
      name fallback, because dropping them would delete most
      swimming pools and all playgrounds.
  poi_activities(poi_type, activity) -- 29 mappings; dog_park and
    outdoor_seating have none, so documented fallbacks are used.
  activity_points(activity, 8 scores on a 0-10 scale)
  age_points(min_age, max_age, 8 scores on a 0-10 scale)

Computation (transparent, no hidden steps):
  1. For each POI type, average the activity vectors of all its
     activities, equally weighted.
  2. For each of the 6 age bands, scale that average by the age
     band: scaled = (activity/10) * (age/10), per dimension.
     This is the deep spec's "scale via age_points" idea, made
     explicit. The default band for the simplified spec is 4-6
     (child age 5).
  3. Aggregate 8 dimensions to the simplified spec's 4:
       cog = mean(cog_exec, found_knowl)
       phy = mean(phys_motor, health)
       soc = mean(soc_emot, lang_comm)
       emo = expl_creat
     The dataset has no separate emotional score; expl_creat
     (expressive / creative play) is the closest proxy and is
     labelled "Creative / Emotional" in the UI. Park and garden
     share the same activity set, so they get identical vectors
     and differ only by location -- a dataset limitation, noted
     in the README and on the page.

Age handling: the source has no per-POI age range, so spark.db
stores min_age=0, max_age=18 for every POI and the age effect is
carried by the age-scaled vectors (vectors_by_age in the JSON).
scoring.age_fit() therefore returns 1.0 for this dataset; do not
present it as a separate age effect in the report.

Dwell time and cost are assumptions by category (see DWELL_MINS /
COST_BY_TYPE), because the source has no visit durations or prices.
op_hours in the source holds OSM tags, not opening hours, and is
ignored.

Usage::

    python3 export_from_poi_db.py \
        --source ~/workspace/user/files/poi__2.db \
        --db spark.db --json-out webapp/data/dtla_pois.json
"""

import argparse
import json
import sqlite3
import sys
from pathlib import Path

DIMS_8 = [
    "soc_emot", "cog_exec", "lang_comm", "phys_motor",
    "expl_creat", "found_knowl", "ind_lifeskills", "health",
]

# Documented fallbacks for types with no activity mapping.
FALLBACK_ACTIVITIES = {
    "dog_park": ["free play"],
    "outdoor_seating": ["picknick"],
}

DWELL_MINS = {
    "playground": 45, "park": 45, "garden": 30, "swimming_pool": 60,
    "sports_centre": 60, "stadium": 60, "fitness_centre": 45,
    "bowling_alley": 60, "amusement_arcade": 45,
    "dog_park": 30, "outdoor_seating": 20,
}

COST_BY_TYPE = {
    "park": "free", "garden": "free", "playground": "free",
    "dog_park": "free", "outdoor_seating": "free",
}


def average_activity_vector(activities, activity_points):
    """Mean of the named activities' 8-dim vectors (0-10 scale)."""
    avg = {}
    for dim in DIMS_8:
        avg[dim] = sum(activity_points[a][dim] for a in activities) / len(activities)
    return avg


def scale_for_age(avg_vector, age_row):
    """Scale an activity vector by an age band, per dimension.

    Returns 4-dim [cog, phy, soc, emo] values in [0, 1].
    """
    scaled = {d: (avg_vector[d] / 10.0) * (age_row[d] / 10.0) for d in DIMS_8}
    return {
        "cog": round((scaled["cog_exec"] + scaled["found_knowl"]) / 2, 4),
        "phy": round((scaled["phys_motor"] + scaled["health"]) / 2, 4),
        "soc": round((scaled["soc_emot"] + scaled["lang_comm"]) / 2, 4),
        "emo": round(scaled["expl_creat"], 4),
    }


def display_name(original_name, poi_type, osm_id):
    """Keep the real name when present; otherwise a clear fallback."""
    if original_name and original_name.strip():
        return original_name.strip(), True
    label = poi_type.replace("_", " ").title()
    return f"{label} #{osm_id}", False


def dwell_for_type(poi_type):
    return DWELL_MINS.get(poi_type, 45)


def load_source(source_path):
    con = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        activity_points = {
            r["activity"]: {d: float(r[d]) for d in DIMS_8}
            for r in con.execute("SELECT * FROM activity_points")
        }
        age_rows = [
            {**{d: float(r[d]) for d in DIMS_8},
             "min_age": int(r["min_age"]), "max_age": int(r["max_age"])}
            for r in con.execute("SELECT * FROM age_points ORDER BY min_age")
        ]
        mapping = {}
        for r in con.execute("SELECT poi_type, activity FROM poi_activities"):
            mapping.setdefault(r["poi_type"], []).append(r["activity"])
        pois = [dict(r) for r in con.execute("SELECT * FROM pois ORDER BY id")]
    finally:
        con.close()
    return activity_points, age_rows, mapping, pois


def enrich_pois(source_path):
    """Return (enriched POIs, stats dict). Raises on missing data."""
    activity_points, age_rows, mapping, raw_pois = load_source(source_path)
    enriched = []
    stats = {"total": len(raw_pois), "unnamed": 0, "fallback_activity": 0, "rejected": []}
    for row in raw_pois:
        # Coordinate correction: source latitude column holds longitude.
        real_lat = float(row["longitude"])
        real_lon = float(row["latitude"])
        if not (33.9 <= real_lat <= 34.2 and -118.4 <= real_lon <= -118.1):
            stats["rejected"].append(
                f"id {row['id']}: corrected coords out of range ({real_lat}, {real_lon})"
            )
            continue
        poi_type = row["type"]
        activities = mapping.get(poi_type, [])
        source = "mapped"
        if not activities:
            activities = FALLBACK_ACTIVITIES.get(poi_type, [])
            source = "fallback"
            stats["fallback_activity"] += 1
        if not activities:
            stats["rejected"].append(f"id {row['id']}: no activities for type {poi_type}")
            continue
        missing = [a for a in activities if a not in activity_points]
        if missing:
            stats["rejected"].append(f"id {row['id']}: unknown activities {missing}")
            continue
        avg = average_activity_vector(activities, activity_points)
        vectors_by_age = {}
        for age_row in age_rows:
            key = f"{age_row['min_age']}-{age_row['max_age']}"
            vectors_by_age[key] = scale_for_age(avg, age_row)
        name, named = display_name(row["name"], poi_type, row["id"])
        if not named:
            stats["unnamed"] += 1
        enriched.append({
            "id": int(row["id"]),
            "name": name,
            "original_name": row["name"] or None,
            "named": named,
            "category": poi_type,
            "lat": real_lat,
            "lon": real_lon,
            "activities": activities,
            "activity_source": source,
            "vectors_by_age": vectors_by_age,
            # Default band 4-6 (age 5), matching the simplified spec.
            **vectors_by_age["4-6"],
            "min_age": 0,
            "max_age": 18,
            "dwell_mins": dwell_for_type(poi_type),
            "cost": COST_BY_TYPE.get(poi_type, "unknown"),
            "tags": {"source": "poi__2.db"},
        })
    return enriched, stats


def write_spark_db(enriched, db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript("""
        DROP TABLE IF EXISTS pois;
        CREATE TABLE pois (
            id INTEGER PRIMARY KEY, osm_id INTEGER, name TEXT NOT NULL,
            category TEXT NOT NULL, latitude REAL NOT NULL,
            longitude REAL NOT NULL, min_age INTEGER NOT NULL,
            max_age INTEGER NOT NULL, dwell_mins INTEGER NOT NULL,
            cost TEXT, cog REAL NOT NULL, phy REAL NOT NULL,
            soc REAL NOT NULL, emo REAL NOT NULL, tags TEXT
        );
        """)
        for poi in enriched:
            conn.execute(
                """INSERT INTO pois (id, osm_id, name, category, latitude,
                   longitude, min_age, max_age, dwell_mins, cost,
                   cog, phy, soc, emo, tags)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (poi["id"], poi["id"], poi["name"], poi["category"],
                 poi["lat"], poi["lon"], poi["min_age"], poi["max_age"],
                 poi["dwell_mins"], poi["cost"], poi["cog"], poi["phy"],
                 poi["soc"], poi["emo"], json.dumps(poi["tags"])),
            )
        conn.commit()
        try:
            conn.execute("DROP TABLE IF EXISTS poi_idx")
            conn.execute("CREATE VIRTUAL TABLE poi_idx USING rtree"
                         "(id, min_lon, max_lon, min_lat, max_lat)")
            conn.execute("INSERT INTO poi_idx SELECT id, longitude, longitude,"
                         " latitude, latitude FROM pois")
            conn.commit()
        except sqlite3.OperationalError as exc:
            print(f"warning: R*Tree not created ({exc})", file=sys.stderr)
    finally:
        conn.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description="Export enriched POIs from poi__2.db")
    parser.add_argument("--source", required=True)
    parser.add_argument("--db", default="spark.db")
    parser.add_argument("--json-out", default="webapp/data/dtla_pois.json")
    args = parser.parse_args(argv)

    enriched, stats = enrich_pois(args.source)
    write_spark_db(enriched, args.db)
    if args.json_out:
        path = Path(args.json_out)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(enriched, indent=1), encoding="utf-8")
    print(f"enriched {len(enriched)} POIs from {stats['total']} source rows "
          f"({stats['unnamed']} unnamed, {stats['fallback_activity']} fallback-activity)")
    print(f"wrote {args.db} and {args.json_out}")
    for message in stats["rejected"]:
        print(f"rejected: {message}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
