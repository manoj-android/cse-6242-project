"""HTTP server and request router for SPARK web application and REST API."""

import argparse
import http.server
import json
import os
import sys
import urllib.parse
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from spark.api.handlers import (
    handle_health,
    handle_pois,
    handle_age_profiles,
    handle_optimize_agenda
)

PRESENTATION_DIR = PROJECT_ROOT / "spark" / "presentation"
CLIENT_DIR = PROJECT_ROOT / "spark" / "api" / "client"
DATA_DIR = PROJECT_ROOT / "spark" / "data"


class SparkRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler for static files and API endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        clean_path = parsed.path.rstrip("/")

        # 1. Root redirect or SPARK dashboard routes
        if clean_path in ("", "/spark", "/spark/presentation", "/index.html") or clean_path.endswith("/index.html"):
            index_path = PRESENTATION_DIR / "index.html"
            self._serve_file(index_path, "text/html; charset=utf-8")
            return

        # 2. REST API Endpoints
        if clean_path == "/api/health":
            status, res = handle_health()
            self._send_json(status, res)
            return

        if clean_path == "/api/pois":
            query_params = urllib.parse.parse_qs(parsed.query)
            child_age = float(query_params.get("age", [5.0])[0])
            status, res = handle_pois(child_age=child_age)
            self._send_json(status, res)
            return

        if clean_path == "/api/age_profiles":
            status, res = handle_age_profiles()
            self._send_json(status, res)
            return

        # 3. Static Presentation & Client Asset Aliases
        if clean_path.endswith("/api_client.js") or clean_path == "/api_client.js":
            client_file = PRESENTATION_DIR / "api_client.js"
            if not client_file.exists():
                client_file = CLIENT_DIR / "api_client.js"
            self._serve_file(client_file, "application/javascript")
            return

        if clean_path.endswith("/app.js") or clean_path == "/app.js":
            app_file = PRESENTATION_DIR / "app.js"
            self._serve_file(app_file, "application/javascript")
            return

        if clean_path.endswith("/style.css") or clean_path == "/style.css":
            css_file = PRESENTATION_DIR / "style.css"
            self._serve_file(css_file, "text/css")
            return

        if clean_path.endswith("/offline_pois.json") or clean_path.endswith("/dtla_pois.json"):
            json_file = DATA_DIR / "offline_pois.json"
            self._serve_file(json_file, "application/json")
            return

        # Standard file fallback from repository root
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        clean_path = parsed.path.rstrip("/")

        if clean_path == "/api/optimize_agenda":
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                self._send_json(400, {"error": {"code": "EMPTY_PAYLOAD", "message": "Request body cannot be empty"}})
                return

            try:
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
            except Exception as e:
                self._send_json(400, {"error": {"code": "INVALID_JSON", "message": f"Malformed JSON: {str(e)}"}})
                return

            status, res = handle_optimize_agenda(payload)
            self._send_json(status, res)
            return

        self._send_json(404, {"error": {"code": "NOT_FOUND", "message": f"Endpoint {clean_path} does not exist"}})

    def _send_json(self, status: int, data: any):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, file_path: Path, content_type: str):
        if not file_path.exists():
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Content-Length", str(file_path.stat().st_size))
        self.end_headers()
        with open(file_path, "rb") as f:
            self.wfile.write(f.read())


# Backward-compatibility alias
SparkCleanRequestHandler = SparkRequestHandler


def run_server(port: int = 8000, host: str = "0.0.0.0"):
    """Starts the HTTP server."""
    server_address = (host, port)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    try:
        httpd = http.server.ThreadingHTTPServer(server_address, SparkRequestHandler)
    except OSError as e:
        if e.errno == 48:
            print(f"\n[Error] Port {port} is already in use by another process.")
            print(f"Suggestions:")
            print(f"  1. Run on a different port:  python3 spark/run.py {port + 1}")
            print(f"  2. Or stop the process using port {port}:  lsof -ti :{port} | xargs kill -9\n")
            sys.exit(1)
        raise e

    print(f"\nSPARK server is ready! Open either URL in your browser:")
    print(f"  * http://127.0.0.1:{port}/")
    print(f"  * http://localhost:{port}/\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SPARK Web & API Server")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="Port to listen on (default: 8000)")
    args = parser.parse_args()
    run_server(port=args.port)

