#!/bin/bash
# Run the SPARK Flask server. Creates a venv on first run so the
# setup survives a VM replacement: prerequisites are restored here,
# not assumed to already exist.
set -euo pipefail
cd "$(dirname "$0")"
VENV="$HOME/workspace/.venvs/spark-venv"
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q flask
fi
if [ ! -f spark.db ]; then
  "$VENV/bin/python" export_from_poi_db.py \
    --source "$HOME/workspace/user/files/poi__2.db" \
    --db spark.db --json-out webapp/data/dtla_pois.json
fi
exec "$VENV/bin/python" app.py --port 5000
