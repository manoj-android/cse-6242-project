# 📋 Project Topic Evaluation: Interstellar Mission Planner

### 🎖️ Overall Score: 8.8 / 10 — Status: 🟢 Greenlight (Strong Potential)

---

### 🛡️ Mandatory Compliance Verification
- [x] **Large, Real, Public Dataset:** [PASS] Uses the [Kaggle Planet Dataset (by Sourav Banerjee)](https://www.kaggle.com/datasets/iamsouravbanerjee/planet-dataset) combined with NASA JPL Horizons (ephemerides data) to ground the simulations in real astrometric and planetary data.
- [x] **No Synthetic / AI-Generated Data:** [PASS] Uses real NASA observational and orbital data.
- [x] **No Private / Proprietary Data:** [PASS] Fully public open-access data.
- [x] **Non-Trivial Algorithms / Computation:** [PASS] Combines unsupervised clustering (to filter real exoplanets based on user sliders) with complex trajectory optimization. Calculating orbital mechanics and gravitational slingshots (gravity assists) involves solving Lambert's problem or using genetic algorithms for launch windows.
- [x] **Interactive Visual User Interface:** [PASS] Features dynamic D3.js UI sliders (hot–cold, small–large, gas–solid surface, distance from Earth). Includes 3D orbital trajectory visualizations and parallel coordinates for planetary stats.
- [x] **No Double-Dipping / Independent Work:** [PASS] Assuming no team member is using this for astrophysics research.

---

### 🏛️ Heilmeier's Catechism Assessment

| # | Heilmeier Question | Status | Assessment & Critique |
| :- | :--- | :---: | :--- |
| **Q1** | **What are you trying to do? (No Jargon)** | PASS | Build a tool where users use sliders to dial in target planetary factors (e.g., hot/cold, small/large), find real exoplanets that fit those criteria, and calculate the satellite trajectories (gravitational slingshots) required to reach them. |
| **Q2** | **How is it done today & limits?** | PASS | Exploring the NASA archive and calculating multi-body gravity assists requires advanced physics engines (like STK) and deep aerospace domain knowledge. |
| **Q3** | **What is new & why successful?** | PASS | Combining exploratory data filtering (ML clustering) with physics-based trajectory optimization, making complex orbital mechanics accessible via an intuitive UI. |
| **Q4** | **Who cares? (Target audience)** | PASS | Aerospace students, astronomy educators, and space enthusiasts. |
| **Q5** | **Impact & measurement methods?** | WARN | Can measure computational success via optimization metrics (e.g., minimizing Delta-V or travel time for the slingshot trajectories). |
| **Q6** | **Risks and payoffs?** | PASS | Risk: Trajectory optimization (N-body problem) can be computationally heavy for a web UI. Payoff: Visually stunning and academically rigorous. |
| **Q7** | **How much will it cost?** | PASS | $0. All NASA data and open-source tools. |
| **Q8** | **How long will it take?** | PASS | Feasible within 12 weeks if the orbital mechanics scope is constrained to simplified 2D/3D Lambert solvers. |
| **Q9** | **Midterm & Final "Exams"?** | PASS | Midterm: Clustering model and baseline single-assist trajectory solver working. Final: Full interactive UI deployed. |

---

### 🔍 Component-by-Component Scoring
- **1. Dataset Compliance & Scale (30%):** 24 / 30 — *The [Kaggle Planet Dataset](https://www.kaggle.com/datasets/iamsouravbanerjee/planet-dataset) provides structured planetary features, while JPL Horizons data provides a robust mix of tabular and time-series orbital data for trajectory physics.*
- **2. Non-Trivial Analytics & Computation (30%):** 28 / 30 — *The gravitational slingshot calculations introduce rigorous physics simulation and combinatorial optimization, making the computational component extremely robust.*
- **3. Interactive Visual User Interface (20%):** 18 / 20 — *High potential for stunning D3.js visuals (interactive 3D solar system/trajectory models).*
- **4. Problem Articulation & Heilmeier Rigor (10%):** 9 / 10 — *Clear, engaging, and highly educational.*
- **5. Feasibility, Independence & 'Exams' (10%):** 9 / 10 — *Highly feasible if trajectory math is kept to known heuristics.*

---

### ⚠️ Identified Gaps & Risk Flags
1. **Computational Latency:** Calculating optimal multi-body gravity assists on the fly might take too long for an interactive web UI.
2. **Data Scale:** You must ensure you pull enough raw orbital/telemetry data to satisfy the "Large Data" requirement, rather than just relying on the small 5,000-row exoplanet summary table.

---

### 🚀 Actionable Enhancement Plan
To solidify this as a 9.0+ / 10 proposal:
- **Optimization Strategy:** Pre-compute a massive grid of launch windows and planetary alignments, or use a fast heuristic (like a Genetic Algorithm) so the UI sliders remain snappy.
- **UI/Viz Upgrades:** Build a "Porkchop Plot" visualizer (a standard aerospace graph showing launch energy vs. time) alongside the 3D trajectory view.
