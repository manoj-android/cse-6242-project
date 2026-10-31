"""Import curated POIs from CSV into SQLite (simplified spec, Section 4).

Usage::

    python3 import_pois.py --csv data/pois.csv --db spark.db
    python3 import_pois.py --csv data/pois.csv --db spark.db --json-out webapp/data/dtla_pois.json

Validation rules (do not silently fix bad data):
  * required columns must be present, and numbers must parse;
  * latitude/longitude must be inside the Downtown LA box;
  * a row whose coordinates look swapped (lat ~ -118, lon ~ 34) is
    rejected with a reason, never auto-corrected;
  * domain scores must be in [0, 1], min_age <= max_age, dwell > 0.

Rejected rows are printed to stderr and counted. The import still
succeeds with the valid rows, so one bad row cannot block the demo,
but it also cannot silently place a POI in the ocean.

The R*Tree index from the deep spec is created when SQLite was
built with the rtree module (the usual case with CPython). If it
is unavailable, the import logs a warning and continues: the
plain table and bounding-box query in app.py still work.
"""

import argparse
import csv
import json
import sqlite3
import sys
from pathlib import Path

from geo import DTLA_BBOX, is_inside_dtla, looks_swapped

SCHEMA = """
CREATE TABLE IF NOT EXISTS pois (
    id          INTEGER PRIMARY KEY,
    osm_id      INTEGER,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    latitude    REAL NOT NULL,
    longitude   REAL NOT NULL,
    min_age     INTEGER NOT NULL,
    max_age     INTEGER NOT NULL,
    dwell_mins  INTEGER NOT NULL,
    cost        TEXT,
    cog         REAL NOT NULL,
    phy         REAL NOT NULL,
    soc         REAL NOT NULL,
    emo         REAL NOT NULL,
    tags        TEXT
);
"""

REQUIRED_COLUMNS = [
    "id", "name", "category", "latitude", "longitude",
    "min_age", "max_age", "dwell_mins", "cog", "phy", "soc", "emo",
]


def _parse_row(row, line_no):
    """Parse and validate one CSV row. Returns (poi dict, error str)."""
    missing = [c for c in REQUIRED_COLUMNS if c not in row or row[c] in (None, "")]
    if missing:
        return None, f"line {line_no}: missing columns/values: {', '.join(missing)}"
    try:
        poi = {
            "id": int(row["id"]),
            "osm_id": int(row["osm_id"]) if row.get("osm_id") else None,
            "name": row["name"].strip(),
            "category": row["category"].strip(),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "min_age": int(row["min_age"]),
            "max_age": int(row["max_age"]),
            "dwell_mins": int(row["dwell_mins"]),
            "cost": (row.get("cost") or "").strip(),
            "cog": float(row["cog"]),
            "phy": float(row["phy"]),
            "soc": float(row["soc"]),
            "emo": float(row["emo"]),
            "tags": (row.get("tags") or "").strip(),
        }
    except (TypeError, ValueError) as exc:
        return None, f"line {line_no}: could not parse numbers: {exc}"
    if not poi["name"]:
        return None, f"line {line_no}: empty name"
    if looks_swapped(poi["latitude"], poi["longitude"]):
        return None, (
            f"line {line_no}: coordinates look swapped "
            f"(lat={poi['latitude']}, lon={poi['longitude']}); not auto-corrected"
        )
    if not is_inside_dtla(poi["latitude"], poi["longitude"]):
        return None, (
            f"line {line_no}: outside Downtown LA box "
            f"{DTLA_BBOX} (lat={poi['latitude']}, lon={poi['longitude']})"
        )
    if any(not 0 <= poi[d] <= 1 for d in ("cog", "phy", "soc", "emo")):
        return None, f"line {line_no}: domain scores must be in [0, 1]"
    if poi["min_age"] > poi["max_age"]:
        return None, f"line {line_no}: min_age > max_age"
    if poi["dwell_mins"] <= 0:
        return None, f"line {line_no}: dwell_mins must be > 0"
    # Normalise tags: keep valid JSON, otherwise store as a plain string.
    if poi["tags"]:
        try:
            json.loads(poi["tags"])
        except json.JSONDecodeError:
            poi["tags"] = json.dumps({"note": poi["tags"]})
    else:
        poi["tags"] = "{}"
    return poi, None


def import_csv(csv_path, db_path):
    """Import a CSV file. Returns (imported_count, rejected list)."""
    rejected = []
    imported = 0
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        with open(csv_path, newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise ValueError(f"{csv_path}: empty CSV file")
            for line_no, row in enumerate(reader, start=2):
                poi, error = _parse_row(row, line_no)
                if error:
                    rejected.append(error)
                    continue
                conn.execute(
                    """
                    INSERT OR REPLACE INTO pois
                    (id, osm_id, name, category, latitude, longitude,
                     min_age, max_age, dwell_mins, cost,
                     cog, phy, soc, emo, tags)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        poi["id"], poi["osm_id"], poi["name"], poi["category"],
                        poi["latitude"], poi["longitude"], poi["min_age"],
                        poi["max_age"], poi["dwell_mins"], poi["cost"],
                        poi["cog"], poi["phy"], poi["soc"], poi["emo"],
                        poi["tags"],
                    ),
                )
                imported += 1
        conn.commit()
        _sync_rtree(conn)
    finally:
        conn.close()
    return imported, rejected


def _sync_rtree(conn):
    """Rebuild the optional R*Tree index; warn and continue if unavailable."""
    try:
        conn.execute("DROP TABLE IF EXISTS poi_idx")
        conn.execute(
            "CREATE VIRTUAL TABLE poi_idx USING rtree"
            "(id, min_lon, max_lon, min_lat, max_lat)"
        )
        conn.execute(
            """
            INSERT INTO poi_idx (id, min_lon, max_lon, min_lat, max_lat)
            SELECT id, longitude, longitude, latitude, latitude FROM pois
            """
        )
        conn.commit()
    except sqlite3.OperationalError as exc:
        print(f"warning: R*Tree index not created ({exc}); continuing without it",
              file=sys.stderr)


def export_json(db_path, json_path):
    """Export all POIs as JSON for the static-server fallback mode."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT * FROM pois ORDER BY id").fetchall()
    finally:
        conn.close()
    pois = []
    for row in rows:
        poi = dict(row)
        poi["lat"] = poi.pop("latitude")
        poi["lon"] = poi.pop("longitude")
        poi["tags"] = json.loads(poi["tags"] or "{}")
        pois.append(poi)
    path = Path(json_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(pois, indent=2), encoding="utf-8")
    return len(pois)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", default="data/pois.csv")
    parser.add_argument("--db", default="spark.db")
    parser.add_argument("--json-out", default=None,
                        help="also export POIs to this JSON path")
    args = parser.parse_args(argv)

    imported, rejected = import_csv(args.csv, args.db)
    for message in rejected:
        print(f"rejected: {message}", file=sys.stderr)
    print(f"imported {imported} POI(s) into {args.db}; "
          f"rejected {len(rejected)} row(s)")
    if args.json_out:
        count = export_json(args.db, args.json_out)
        print(f"exported {count} POI(s) to {args.json_out}")
    return 0 if imported else 1


if __name__ == "__main__":
    raise SystemExit(main())
