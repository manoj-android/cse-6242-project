"""SPARK Package Entrypoint.

Allows running SPARK directly with:
    python3 -m spark [port]
"""

import sys
from spark.api.server import run_server

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8000
    run_server(port=port)

