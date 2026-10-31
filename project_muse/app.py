"""SPARK API Server & Static Asset Host.

Endpoints:
  POST /api/optimize_agenda  {latitude, longitude, child_age, radius_miles, n_activities, ...}
  GET  /api/age_profiles     Returns age milestone factor weighting metadata
  GET  /api/health           Health check and DB status
  GET  /api/pois             Bounding-box POI querying
  POST /api/plan             Legacy route planning endpoint

Serves the presentation web application located at `webapp/index.html`.
"""

import argparse
import json
import sqlite3
import sys
from pathlib import Path

# Paths
SPARK_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SPARK_DIR.parent
POI_DB_PATH = (PROJECT_DIR / "data" / "poi.db") if (PROJECT_DIR / "data" / "poi.db").exists() else (PROJECT_DIR / "poi.db")
SPARK_DB_PATH = SPARK_DIR / "spark.db"

# Prefer project-level spark app if present, then webapp, fallback to internal
if (PROJECT_DIR / "spark").exists():
    WEBAPP_DIR = PROJECT_DIR / "spark"
elif (PROJECT_DIR / "webapp").exists():
    WEBAPP_DIR = PROJECT_DIR / "webapp"
else:
    WEBAPP_DIR = SPARK_DIR / "webapp"

# Ensure spark module can be imported
if str(SPARK_DIR) not in sys.path:
    sys.path.insert(0, str(SPARK_DIR))

try:
    from optimizer import optimize_spark_outing, load_data_from_sqlite, FACTORS
except ImportError:
    optimize_spark_outing = None


def get_age_profiles_data(db_path=POI_DB_PATH):
    """Loads age weight milestones from poi.db."""
    if not Path(db_path).exists():
        return []
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT * FROM age_points ORDER BY min_age").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def run_optimize_agenda(body):
    """Executes the SPARK multi-objective optimizer and returns standard response."""
    if optimize_spark_outing is None:
        raise RuntimeError("Optimizer engine not available.")

    lat = float(body.get("latitude", 34.0488))
    lon = float(body.get("longitude", -118.2518))
    child_age = float(body.get("child_age", 5.0))
    radius_miles = float(body.get("radius_miles", 3.0))
    n_activities = int(body.get("n_activities", body.get("target_stops", 2)))
    distance_pen = float(body.get("distance_penalty", body.get("tradeoff_priority", 0.12)))

    origin = {
        "name": body.get("origin_name", "Pershing Square (DTLA)"),
        "lat": lat,
        "lon": lon
    }

    payload = optimize_spark_outing(
        origin=origin,
        child_age=child_age,
        radius_miles=radius_miles,
        target_stops=n_activities,
        tradeoff_priority=distance_pen,
        iterations=15000
    )
    return payload


def create_flask_app():
    """Builds and configures the Flask application."""
    from flask import Flask, jsonify, request, send_from_directory

    app = Flask(__name__, static_folder=str(WEBAPP_DIR), static_url_path="")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response

    @app.get("/")
    @app.get("/spark")
    @app.get("/spark/")
    @app.get("/webapp")
    @app.get("/webapp/")
    def index():
        index_file = WEBAPP_DIR / "index.html"
        if index_file.exists():
            return send_from_directory(str(WEBAPP_DIR), "index.html")
        return jsonify({
            "message": "SPARK API is running. Presentation app located at spark/index.html",
            "endpoints": ["/api/optimize_agenda", "/api/age_profiles", "/api/health"]
        })

    @app.get("/spark/<path:filename>")
    @app.get("/webapp/<path:filename>")
    def webapp_static(filename):
        return send_from_directory(str(WEBAPP_DIR), filename)

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "poi_db_exists": POI_DB_PATH.exists(),
            "spark_db_exists": SPARK_DB_PATH.exists(),
            "webapp_dir": str(WEBAPP_DIR)
        })

    @app.get("/api/age_profiles")
    def age_profiles():
        data = get_age_profiles_data()
        return jsonify(data)

    @app.post("/api/optimize_agenda")
    def api_optimize_agenda():
        body = request.get_json(silent=True) or {}
        try:
            result = run_optimize_agenda(body)
            return jsonify(result)
        except ValueError as ve:
            return jsonify({
                "status": "error",
                "error_code": "INSUFFICIENT_ACTIVITIES",
                "message": str(ve)
            }), 422
        except Exception as exc:
            return jsonify({
                "status": "error",
                "error_code": "INTERNAL_ERROR",
                "message": str(exc)
            }), 500

    return app


def run_http_server(port=5000):
    """Pure Python standard-library HTTP server fallback (no pip dependencies required)."""
    import http.server
    import urllib.parse

    class SparkHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(WEBAPP_DIR), **kwargs)

        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
            super().end_headers()

        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()

        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            clean_path = parsed.path
            # Rewrite /spark/ or /webapp/ prefix to root of presentation directory
            if clean_path in ("/spark", "/spark/", "/webapp", "/webapp/"):
                clean_path = "/index.html"
            elif clean_path.startswith("/spark/"):
                clean_path = clean_path[len("/spark"):]
            elif clean_path.startswith("/webapp/"):
                clean_path = clean_path[len("/webapp"):]

            if clean_path == "/api/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                res = {"status": "healthy", "mode": "http.server fallback", "poi_db_exists": POI_DB_PATH.exists()}
                self.wfile.write(json.dumps(res).encode("utf-8"))
                return
            elif clean_path == "/api/age_profiles":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                data = get_age_profiles_data()
                self.wfile.write(json.dumps(data).encode("utf-8"))
                return

            self.path = clean_path
            if parsed.query:
                self.path += "?" + parsed.query
            super().do_GET()

        def do_POST(self):
            parsed = urllib.parse.urlparse(self.path)
            clean_path = parsed.path
            if clean_path.startswith("/spark/"):
                clean_path = clean_path[len("/spark"):]
            elif clean_path.startswith("/webapp/"):
                clean_path = clean_path[len("/webapp"):]

            if clean_path in ("/api/optimize_agenda", "/api/plan"):
                length = int(self.headers.get("Content-Length", 0))
                body_bytes = self.rfile.read(length) if length > 0 else b"{}"
                try:
                    body = json.loads(body_bytes.decode("utf-8"))
                    result = run_optimize_agenda(body)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode("utf-8"))
                except ValueError as ve:
                    self.send_response(422)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    err = {"status": "error", "error_code": "INSUFFICIENT_ACTIVITIES", "message": str(ve)}
                    self.wfile.write(json.dumps(err).encode("utf-8"))
                except Exception as exc:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    err = {"status": "error", "error_code": "INTERNAL_ERROR", "message": str(exc)}
                    self.wfile.write(json.dumps(err).encode("utf-8"))
                return
            self.send_response(404)
            self.end_headers()

    print(f"Starting SPARK Server on http://127.0.0.1:{port} (serving {WEBAPP_DIR})...")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), SparkHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down SPARK Server.")
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SPARK Web Application & API Server")
    parser.add_argument("--port", type=int, default=5000, help="Port to listen on (default 5000)")
    parser.add_argument("--mode", choices=["auto", "flask", "stdlib"], default="auto", help="Server backend mode")
    args = parser.parse_args()

    if args.mode == "flask" or args.mode == "auto":
        try:
            import flask
            app = create_flask_app()
            print(f"Starting Flask SPARK Server on http://127.0.0.1:{args.port}...")
            app.run(host="127.0.0.1", port=args.port, debug=False)
        except ImportError:
            if args.mode == "flask":
                print("Flask is not installed. Install with 'pip install flask' or run with --mode stdlib.")
                sys.exit(1)
            print("Flask not detected; falling back to built-in HTTP server...")
            run_http_server(port=args.port)
    else:
        run_http_server(port=args.port)
