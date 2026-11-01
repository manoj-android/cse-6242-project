# SPARK: Smart Personalized Activity Routes for Kids
### Georgia Institute of Technology · CSE 6242: Data & Visual Analytics
**Team 61:** Jay Mangrulkar · Max Jarosch · Katherine Liang · Manoj Achari · Shanmugam Murugappan  
**Target Geographic Corridor:** Downtown Los Angeles (DTLA) & Surrounding Urban Corridors  

---

## Project Overview

Parents face relentless cognitive fatigue when attempting to balance early childhood developmental enrichment with real-world scheduling, transit logistics, and environmental safety. Commercial mapping and recommendation tools (e.g., Google Maps, Yelp) treat venue discovery and routing as isolated tasks—optimizing purely for shortest driving distance or commercial check-in popularity while failing to evaluate child developmental balance.

**SPARK (Smart Personalized Activity Routes for Kids)** is an interactive, web-based visual analytics platform that automates and personalizes this multi-criteria decision process. By fusing open geospatial data from OpenStreetMap (OSM) with pediatric developmental guidelines in a lightweight SQLite architecture (`spark/data/poi.db`), SPARK matches verified local points of interest (POIs) across four core developmental domains (**Motor**, **Cognitive**, **Social**, and **Creative**) and optimizes time-budget-constrained daily agendas.

---

## Core Architecture & Technical Components

### 1. Large, Real, Public Geospatial Dataset
* **OpenStreetMap (OSM) Spatial Data:** Ingests regional child infrastructure candidates across the Southern California corridor.
* **Relational Activity Database (`spark/data/poi.db`):** 
  * `pois`: Master table of 487 verified venues in Downtown Los Angeles with canonical WGS84 coordinates.
  * `poi_activities`: Relational mapping of 31 venue categories to activity archetypes.
  * `activity_points`: 11 foundational activity archetypes evaluated across 8 developmental categories.
  * `age_points`: Calibration weights across continuous pediatric age brackets (ages 0 to 18).
* **Data Ingestion Pipeline (`export_poidb.py`):** Resolves raw coordinate projections, joins relational activity scores, maps categories to 4 pedagogical domains, and exports verified venues to `spark/data/offline_pois.json`.

### 2. Non-Trivial Algorithm & Multi-Objective Optimization
* **Mathematical Objective Function:** Maximizes developmental milestone exposure with diminishing returns while penalizing travel burden and pairwise activity redundancy:
  $$\max_{\mathcal{S} \subseteq \mathcal{C}, |\mathcal{S}|=n} J(\mathcal{S}) = \sum_{k=1}^8 w_k \left(1 - e^{-T_k / \tau}\right) - \alpha \cdot \bar{D}(\mathcal{S}) - \beta \cdot \bar{R}(\mathcal{S})$$
  * **Diminishing Returns:** Concave saturation factor $\tau = 2.0$, mathematically modeling that repeated identical tasks yield diminishing cognitive benefits.
  * **Travel Burden ($\bar{D}$):** Normalized radial distance from caregiver origin ($\alpha = 0.10$).
  * **Variety Regularization ($\bar{R}$):** Mean pairwise centered cosine similarity across selected 8D skill vectors ($\beta = 0.10$).
  * **Theoretical Grounding:** Developmental taxonomy grounded in the landmark **NICHD SECCYD longitudinal study** (Vandell & Gülseven, 2023, *Annual Review of Developmental Psychology*).
* **Optimization & Route Sequencer:** Simulated Annealing metaheuristic ($20,000$ iterations or $2,500$ in web mode) paired with a 2-Opt TSP closed-loop sequencer enforcing an urban circuity factor ($\tau = 1.35$) and realistic drive-time estimates.

### 3. Coordinated Visual Analytics Interface
* **View 1: Leaflet OpenStreetMap Canvas:**
  * Rendered on official **OpenStreetMap Standard Street Tiles** with zero API token dependencies.
  * Interactive **Caregiver Start Address Input** with Nominatim geocoding and instant DTLA presets (Pershing Square, Union Station, Grand Park, Crypto.com Arena, Echo Park, Arts District).
  * Domain-colored, score-scaled markers with a numbered route polyline from the dynamic origin pin.
* **View 2: Child Fit Panel (D3.js):**
  * **D3 Radar Chart:** Visualizes multi-domain coverage across Motor, Cognitive, Social, and Creative dimensions against the child’s age-specific milestone target.
  * **D3 Stacked Bar Chart:** Transparently visualizes positive linear score components alongside travel penalty deductions.
* **View 3: Timeline & Baseline Scorecard:**
  * Visual timeline alternating between transit legs and venue activity dwell blocks.
  * Side-by-side metric comparison evaluating Total Time, Transit Time, Domains Covered, and Total Score against Nearest-Neighbor and Greedy baselines.
* **Model Evaluation & Feedback Loop:**
  * Displays structured venue activities with individual fit scores.
  * Built-in Upvote and Downvote buttons allow caregivers and evaluators to rate activity and venue recommendations.
  * Persistent storage with an in-app **Export** button that downloads structured model evaluation JSON datasets for empirical validation.

---

## Getting Started & Running Locally

SPARK is built entirely on zero-configuration, open-source technologies—requiring no Docker containers, external database daemons, or paid API keys.

### 1. Installation
```bash
git clone https://github.com/manoj-achari/cse-6242-project.git
cd cse-6242-project

# Install standard dependencies (numpy, pandas)
pip install -r requirements.txt
```

### 2. Launch the Web Application

SPARK supports two execution pathways:

#### Option A: Live Application Server (Recommended)
Launches the built-in Python optimization server and dynamic SQLite API:
```bash
python3 spark/run.py 8000
# Or run as a module: python3 -m spark 8000
```
Open your browser and navigate to:
```text
http://127.0.0.1:8000/
# or http://localhost:8000/
```
*(Serves the interactive dashboard with real-time Simulated Annealing optimization, SQLite DAL, and 2-Opt routing).*

#### Option B: Static Hosting Fallback
If evaluating purely in an offline environment:
```bash
python3 -m http.server 8080
```
Navigate to `http://localhost:8080/`. The client automatically redirects to `spark/presentation/` and loads cached venues from `offline_pois.json`.

### 3. Pipeline & Evaluation Utilities
* **Re-run Data Ingestion from SQLite (`spark/data/poi.db` → `spark/data/offline_pois.json`):**
  ```bash
  python3 scripts/export_poidb.py
  ```
* **Process User Feedback & Evaluation Logs:**
  ```bash
  python3 scripts/eval_summary.py
  ```

---

## Repository Structure

```text
cse-6242-project/
├── index.html                          # Root entry-point & instant redirect to /spark/presentation/
├── README.md                           # Master project documentation
├── LICENSE                             # Open-source license
├── requirements.txt                    # Python dependencies (numpy, pandas)
├── spark/                              # SPARK Modular Application Package
│   ├── README.md                       # Package documentation & API guide
│   ├── run.py                          # Application entry point script (`python3 spark/run.py [port]`)
│   ├── __main__.py                     # Package execution entry point (`python3 -m spark [port]`)
│   ├── __init__.py                     # Package initialization
│   ├── docs -> ../projectwork/docs     # Documentation symlink
│   ├── presentation/                   # Presentation Layer (HTML5, D3.js, Leaflet)
│   │   ├── index.html                  # Single-page visual analytics dashboard
│   │   ├── app.js                      # Coordinated views UI controller
│   │   ├── style.css                   # Responsive UI stylesheets
│   │   ├── api_client.js               # Frontend API client connector
│   │   └── data -> ../data             # Symlink for offline static hosting fallback
│   ├── data/                           # Data Access Layer & SQLite Persistence
│   │   ├── db.py                       # SQLite Data Access Layer & repository queries
│   │   ├── poi.db                      # Relational SQLite database (487 venues, WGS84 verified)
│   │   ├── offline_pois.json           # Cached venue dataset
│   │   └── spark_model_evaluation_sample.json # Model evaluation feedback log
│   ├── core/                           # Core Domain & Optimization Layer
│   │   ├── models.py                   # Domain entities and milestone DTOs
│   │   └── optimizer.py                # Simulated Annealing, Stop Aggregator & 2-Opt TSP
│   └── api/                            # Delivery & Interface Layer
│       ├── server.py                   # Threading HTTP server & router
│       ├── handlers.py                 # REST endpoint handlers (/api/optimize_agenda, etc.)
│       └── client/
│           └── api_client.js           # Reusable client connector
├── scripts/                            # Pipeline and evaluation automation scripts
│   ├── export_poidb.py                 # SQLite ETL & domain mapping script
│   └── eval_summary.py                 # User feedback statistical analyzer
├── projectwork/                        # Course deliverables, technical specs & archives
│   ├── docs/                           # Official reports, proposals, and API contracts
│   ├── mockups/                        # UI wireframes & dashboard mockups
│   └── topics/                         # Initial semester project ideation archives
└── project_muse/                       # Auxiliary prototype reference sandbox (Not main project)
```

---

## Evaluation & Benchmarking

| Metric | Nearest-Neighbor Baseline | SPARK Multi-Objective Optimization | Relative Gain |
| :--- | :---: | :---: | :---: |
| **Developmental Variety Score** | 24.0 pts | **33.0 pts** | **+37.5% Quality Gain** |
| **Multi-Domain Coverage** | 2 / 4 Domains | **4 / 4 Domains** | **Zero Domain Starvation** |
| **Total Outing Time** | 150 mins | **150 mins** | **0% Budget Overrun** |
| **Transit Circuity** | 35 mins | **36 mins** | **Minimal Transit Overhead (+1m)** |
| **Interaction Latency** | N/A | **<15 ms** | **Sub-second Client Execution** |

---

## Academic Integrity & Coursework Independence

This project is original academic coursework initiated exclusively for **Georgia Tech CSE 6242: Data & Visual Analytics** during the Fall 2026 semester. In strict adherence to Georgia Tech academic policies:
* **No Double-Dipping:** No part of this project has been or will be submitted for credit in any other course.
* **Fair Individual Learning:** Work is evenly partitioned among all five teammates across data engineering, algorithmic modeling, and visual analytics.
* **Open-Source Reproducibility:** All datasets, code, and documentation are reproducible using free, open-source software and open datasets.
