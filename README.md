# ⚡ SPARK: Smart Personalized Activity Routes for Kids
### Georgia Institute of Technology · CSE 6242: Data & Visual Analytics
**Team 61:** Jay Mangrulkar · Max Jarosch · Katherine Liang · Manoj Achari · Shanmugam Murugappan  
**Target Geographic Corridor:** Downtown Los Angeles (DTLA) & Surrounding Urban Corridors  

---

## 📖 Project Overview

Parents face relentless cognitive fatigue when attempting to balance early childhood developmental enrichment with real-world scheduling, transit logistics, and environmental safety. Commercial mapping and recommendation tools (e.g., Google Maps, Yelp) treat venue discovery and routing as isolated tasks—optimizing purely for shortest driving distance or commercial check-in popularity while failing to evaluate child developmental balance.

**SPARK (Smart Personalized Activity Routes for Kids)** is an interactive, web-based visual analytics platform that automates and personalizes this multi-criteria decision process. By fusing open geospatial data from OpenStreetMap (OSM) with pediatric developmental guidelines in a lightweight SQLite architecture (`poi.db`), SPARK matches verified local points of interest (POIs) across four core developmental domains (**Motor**, **Cognitive**, **Social**, and **Creative**) and optimizes time-budget-constrained daily agendas.

---

## 🏛️ The Three Core Technical Components (CSE 6242 Compliance)

### 1. Large, Real, Public Geospatial Dataset
* **OpenStreetMap (OSM) Spatial Data:** Ingests regional child infrastructure candidates across the Southern California corridor.
* **Relational Activity Database (`poi.db`):** 
  * `pois`: Master table of verified venues in Downtown Los Angeles.
  * `poi_activities`: Relational mapping of 29 venue categories to activity types.
  * `activity_points`: 11 foundational activity archetypes evaluated across 8 developmental categories.
  * `age_points`: Calibration weights across 6 childhood age brackets (toddler to school-age).
* **Data Ingestion Pipeline (`export_poidb.py`):** Resolves raw coordinate projections, joins relational activity scores, maps categories to 4 pedagogical domains, and exports 48 verified venues to `spark/data/dtla_pois.json`.

### 2. Non-Trivial Algorithm & Multi-Objective Optimization
* **Pediatric Scoring Function:** Evaluates venue suitability using an explainable linear combination:
  $$\text{Score}(v) = 0.60 \times \text{DevFit} + 0.25 \times \text{AgeFit} + 0.15 \times \text{CaregiverPref} - \text{TravelPenalty}(v)$$
* **Fast Greedy Routing Engine (<15ms):** Sequences stops to maximize composite developmental enrichment within a strict caregiver time budget ($T_{\text{budget}} \in [60, 240]\text{ mins}$), enforcing a closed home return loop and child fatigue limits ($2 \le |\mathcal{R}| \le 3$ stops).
* **Quantitative Benchmark:** Delivers $\ge 35\%$ higher multi-domain developmental variety (observed $+37.5\%$) compared to a default Nearest-Neighbor baseline.

### 3. Coordinated Multiple-View (CMV) Visual Analytics Interface
* **View 1: Leaflet OpenStreetMap Canvas:**
  * Rendered on official **OpenStreetMap Standard Street Tiles** (`tile.openstreetmap.org`) with zero API key dependencies.
  * Interactive **Caregiver Home Address Input** powered by the **OpenStreetMap Nominatim Geocoding API**, with instant DTLA presets (Pershing Square, Union Station, Grand Park, Crypto.com Arena, Echo Park, Arts District).
  * Domain-colored, score-scaled markers with a numbered route polyline from the dynamic origin pin (`🏠`).
* **View 2: Child Fit Panel (D3.js):**
  * **D3 Radar Chart:** Visualizes multi-domain coverage across Motor, Cognitive, Social, and Creative dimensions against the child’s age-5 baseline need.
  * **D3 Stacked Bar Chart:** Transparently visualizes positive linear score components (Dev Fit, Age Fit, Caregiver Pref) alongside the transit penalty deduction.
* **View 3: Horizontal Timeline & Baseline Scorecard:**
  * Visual timeline alternating between travel legs (`🚗 8m`) and dwell blocks (`Stop 1: Grand Park 60m`).
  * Direct side-by-side metric comparison evaluating Total Time, Transit Time, Domains Covered, and Total Score against Nearest-Neighbor.
* **In-Situ Model Evaluation & Feedback Loop:**
  * Hovering/clicking any POI displays an aligned, formatted activity list with individual fit scores.
  * Built-in `👍` (Upvote) and `👎` (Downvote) buttons allow caregivers and evaluators to grade activity and venue recommendations.
  * Persistent storage with an in-app **Export** button that downloads structured model evaluation JSON datasets for empirical validation (Heilmeier Q5).

---

## 🚀 Quick Start & How to Run Locally

SPARK is built entirely on zero-configuration, open-source technologies—requiring no Docker containers, external database daemons, or paid API keys.

### 1. Clone the Repository
```bash
git clone https://github.com/manoj-achari/cse-6242-project.git
cd cse-6242-project
```

### 2. Launch the Web Application
Start a local static HTTP server using Python's built-in module from the repository root:
```bash
python3 -m http.server 8080
```

Open your browser and navigate to:
```text
http://localhost:8080/
```
The root `index.html` automatically redirects to `http://localhost:8080/spark/`.

*(Alternatively, you can open `spark/index.html` directly in any modern browser, as all venue and model fallback data is pre-embedded).*

### 3. Pipeline & Evaluation Utilities
* **Re-run Data Ingestion from SQLite (`data/poi.db` → `spark/data/dtla_pois.json`):**
  ```bash
  python3 scripts/export_poidb.py
  ```
* **Process User Feedback & Evaluation Logs (CSE 6242 Final Report Analytics):**
  ```bash
  python3 scripts/eval_summary.py
  ```

---

## 📁 Repository Structure

```text
cse-6242-project/
├── index.html                          # Root entry-point & instant redirect to /spark/
├── README.md                           # Master project documentation
├── LICENSE                             # Open-source license
├── .gitignore                          # Git tracking configuration
├── data/                               # Project databases & evaluation datasets
│   ├── poi.db                          # Relational SQLite database (pois, activities, age weights)
│   └── spark_model_evaluation_sample.json # Sample evaluation feedback dataset
├── scripts/                            # Pipeline and evaluation automation scripts
│   ├── export_poidb.py                 # SQLite ETL, coordinate fix & domain mapping script
│   └── eval_summary.py                 # User feedback & model evaluation statistical analyzer
├── spark/                              # Official Interactive Visual Analytics Dashboard
│   ├── index.html                      # HTML5 interface with controls & coordinated view layout
│   ├── style.css                       # Modern dark-mode UI stylesheet with custom Leaflet styling
│   ├── app.js                          # Routing engine, Leaflet OSM map, D3 charts & eval handler
│   └── data/
│       └── dtla_pois.json              # 48 verified Downtown LA venues enriched from poi.db
├── projectwork/                        # Course deliverables, technical specs & archives
│   ├── docs/                           # Official reports, proposals, and API contracts
│   ├── mockups/                        # UI wireframes & dashboard mockups
│   ├── sample/                         # Academic reference papers
│   └── topics/                         # Initial semester project ideation archives
└── project_muse/                       # Auxiliary prototype reference sandbox (Not main project)
```

---

## 📊 Evaluation & Benchmarking

| Metric | Nearest-Neighbor Baseline | SPARK Multi-Objective Optimization | Relative Gain |
| :--- | :---: | :---: | :---: |
| **Developmental Variety Score** | 24.0 pts | **33.0 pts** | **+37.5% Quality Gain** |
| **Multi-Domain Coverage** | 2 / 4 Domains | **4 / 4 Domains** | **Zero Domain Starvation** |
| **Total Outing Time** | 150 mins | **150 mins** | **0% Budget Overrun** |
| **Transit Circuity** | 35 mins | **36 mins** | **Minimal Transit Overhead (+1m)** |
| **Interaction Latency** | N/A | **<15 ms** | **Sub-second Client Execution** |

---

## 📜 Academic Integrity & Independence

This project is original academic coursework initiated exclusively for **Georgia Tech CSE 6242: Data & Visual Analytics** during the Fall 2026 semester. In strict adherence to Georgia Tech academic policies:
* **No Double-Dipping:** No part of this project has been or will be submitted for credit in any other course.
* **Fair Individual Learning:** Work is evenly partitioned among all five teammates across data engineering, algorithmic modeling, and visual analytics.
* **Open-Source Reproducibility:** All datasets, code, and documentation are reproducible using free, open-source software and open datasets.
