# SPARK Optimizer: API Contract & Architecture Specification

---

## Summary

The SPARK Client-Server Architecture connects two halves of our visual analytics platform:
- **Input (from the Caregiver / Frontend):** Starting address or map coordinates, child's developmental age, search radius, target stop count, and continuous $\lambda$ trade-off penalty.
- **Backend Service (`spark/`):** Python standard library server querying SQLite ([`spark/data/poi.db`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/data/poi.db)), executing Simulated Annealing multi-objective optimization and 2-Opt TSP closed-loop sequencing.
- **Output (to the UI):** Dynamic JSON payload containing ordered itinerary stops, exact venue activities, and multi-dimensional developmental coverage directly driving our Leaflet map and D3 coordinated views.

---

## 1. REST Endpoints Overview

| Method | Endpoint | Description | Backing Data Source |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/optimize_agenda` | Runs Simulated Annealing + 2-Opt TSP outing optimization | SQLite `pois`, `poi_activities`, `activity_points`, `age_points` |
| `GET`  | `/api/pois` | Dynamic candidate POIs with activities and 8D factor scores | SQLite `pois` joined with activities and CDC weights |
| `GET`  | `/api/age_profiles` | CDC milestone factor weights across pediatric age bands | SQLite `age_points` table |
| `GET`  | `/api/health` | Service health telemetry and database connection status | In-memory health check & SQLite connection test |

---

## 2. API Request: What the Frontend Sends

```http
POST /api/optimize_agenda
Content-Type: application/json
```

```json
{
  "latitude": 34.0488,         // Caregiver starting latitude (e.g. Pershing Square, DTLA)
  "longitude": -118.2518,      // Caregiver starting longitude
  "origin_name": "Pershing Square (DTLA)", // Human-readable start label
  "child_age": 5.0,            // Child's age in years (used for pediatric milestone weights)
  "radius_miles": 3.0,         // Search radius from starting point (default: 3.0)
  "n_activities": 2,           // Number of stops wanted (default: 2)
  "distance_penalty": 0.12,    // Higher value keeps stops closer to home (lambda)
  "redundancy_penalty": 0.10,  // Higher value penalizes similar activity types
  "enforce_unique_pois": true  // Disallows visiting the same physical venue twice
}
```

---

## 3. API Response: What the UI Renders

The backend returns a clean JSON package with structured sections:

```json
{
  "status": "success",
  "metadata": {
    "child_age": 5.0,
    "search_radius_miles": 3.0,
    "target_stops": 2,
    "effective_stops": 2,
    "origin": {
      "name": "Pershing Square (DTLA)",
      "latitude": 34.0488,
      "longitude": -118.2518
    },
    "optimizer_telemetry": {
      "algorithm": "Simulated Annealing + 2-Opt TSP",
      "iterations": 2500,
      "objective_value": 0.5162,
      "execution_time_ms": 331.1
    }
  },
  "summary": {
    "objective_value": 0.516,
    "development_value": 0.520,
    "distance_cost": 0.030,
    "redundancy_score": 0.000,
    "unique_activities": 2,
    "unique_pois": 2
  },
  "developmental_coverage": {
    "soc_emot": { "name": "Social-Emotional", "age_weight": 0.141, "coverage": 0.589 },
    "cog_exec": { "name": "Cognitive & Executive", "age_weight": 0.125, "coverage": 0.565 },
    "lang_comm": { "name": "Language & Communication", "age_weight": 0.141, "coverage": 0.510 },
    "phys_motor": { "name": "Physical & Gross Motor", "age_weight": 0.125, "coverage": 0.500 },
    "expl_creat": { "name": "Exploration & Creativity", "age_weight": 0.125, "coverage": 0.500 },
    "found_knowl": { "name": "Foundational Knowledge", "age_weight": 0.109, "coverage": 0.500 },
    "ind_lifeskills": { "name": "Independence & Life Skills", "age_weight": 0.109, "coverage": 0.500 },
    "health": { "name": "Health & Safety Habits", "age_weight": 0.125, "coverage": 0.500 }
  },
  "agenda": [
    {
      "selection_order": 1,
      "id": 80579943,
      "name": "Pershing Square",
      "type": "park",
      "activity": "hide-and-seek",
      "distance_miles": 0.08,
      "latitude": 34.048396,
      "longitude": -118.253022,
      "factor_scores": {
        "soc_emot": 8, "cog_exec": 8, "lang_comm": 6, "phys_motor": 9,
        "expl_creat": 9, "found_knowl": 6, "ind_lifeskills": 8, "health": 7
      }
    },
    {
      "selection_order": 2,
      "id": 369954714,
      "name": "Grand Hope Park",
      "type": "park",
      "activity": "picknick",
      "distance_miles": 0.12,
      "latitude": 34.047904,
      "longitude": -118.253498,
      "factor_scores": {
        "soc_emot": 10, "cog_exec": 9, "lang_comm": 9, "phys_motor": 2,
        "expl_creat": 7, "found_knowl": 9, "ind_lifeskills": 7, "health": 8
      }
    }
  ]
}
```

### 3.1 Error Response Contract

When a request cannot be processed, the service returns a structured error object with an appropriate HTTP error status:

```json
{
  "error": {
    "code": "NO_AGE_BAND",
    "message": "No age band matches child_age."
  }
}
```

#### Standard Error Code Reference:

| HTTP Status | Error Code | Description / Trigger Condition |
| :---: | :--- | :--- |
| **400 Bad Request** | `NO_AGE_BAND` | The input `child_age` falls outside calibrated intervals `(min_age <= child_age < max_age)` in the `age_points` database table. |
| **400 Bad Request** | `INVALID_JSON` | Malformed or non-parseable JSON payload in the request body. |
| **400 Bad Request** | `OUT_OF_BOUNDS_LOCATION` | The origin coordinates fall outside the valid geographic bounds. |
| **422 Unprocessable**| `INSUFFICIENT_ACTIVITIES` | Fewer distinct activities exist within `radius_miles` than requested `n_activities` (prompts caregiver in UI to widen radius or reduce stops). |
| **422 Unprocessable**| `INFEASIBLE_AGENDA` | The combinatorial solver was unable to construct an agenda satisfying all constraints within the iteration budget. |
| **500 Server Error**  | `INVALID_AGE_WEIGHTS` | Database integrity error: age milestone weights contain negative values or sum to $\le 0$. |
| **500 Server Error**  | `INTERNAL_ERROR` | An unhandled exception occurred during optimizer or database execution. |

---

## 4. Implementation Details & Architecture

1. **Database Path Resolution:**
   The SQLite database is located at [`spark/data/poi.db`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/data/poi.db). The data access layer in [`spark/data/db.py`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/data/db.py) automatically resolves this file.
2. **Canonical WGS84 Coordinates:**
   The SQLite database [`spark/data/poi.db`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/data/poi.db) stores verified canonical WGS84 coordinates directly (`latitude` $\in [34.04, 34.09]$, `longitude` $\in [-118.34, -118.25]$). The DAL in [`spark/data/db.py`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/data/db.py) provides backward-compatible `real_lat` and `real_lon` aliases so markers and polylines plot accurately across all visual views.
3. **The "Whichever Is Least" Rule:**
   If a parent asks for 4 stops but only 2 venues exist within their chosen radius, the app caps the itinerary at 2 stops gracefully rather than failing.
4. **Direct Server JSON Consumption:**
   The frontend in [`spark/presentation/app.js`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/presentation/app.js) directly consumes the live JSON response from `POST /api/optimize_agenda`:
   - Route polyline is rendered from `agenda` lat/lons.
   - D3 Radar Chart domain coverage is updated from `developmental_coverage`.
   - Itinerary cards feature the specific `activity` recommended by the optimizer.
5. **Offline / Standalone Fallback:**
   If the Python server is offline, [`spark/presentation/api_client.js`](file:///Users/tejashriachari/Documents/Gatech/CSE_6242/cse-6242-project/spark/presentation/api_client.js) gracefully degrades to embedded client-side heuristics so the application continues functioning.

---

## 5. How to Run the Server

```bash
# From repository root:
python3 spark/run.py 8000
```
Then visit: `http://localhost:8000/`
