# SPARK: Interactive Visual Analytics Component Specification
## Standard Web UI Components, Algorithmic Explainability & Trade-Off Navigation
**Course:** Georgia Tech — CSE 6242: Data & Visual Analytics  
**Document:** Technical Component Specification & Final Report Section  
**Authors:** Team 61 (Jay Mangrulkar, Max Jarosch, Katherine Liang, Manoj Achari, Shanmugam Murugappan)

---

## 1. Visual Analytics Philosophy: Human-in-the-Loop Decision Support

Traditional recommendation systems and route schedulers operate under an automated "black box" assumption: the user inputs parameters, the algorithm executes opaque matrix factorizations or distance-minimization heuristics, and outputs a static, take-it-or-leave-it itinerary [12, 15]. For pediatric family outings, this paradigm fails fundamentally because parental decision-making is nuanced, dynamic, and non-linear:
* A caregiver may gladly accept **8 extra minutes of driving** if it guarantees an ADA-accessible splash pad with dense tree canopy shade.
* A parent managing a cranky toddler may prefer a **shorter 90-minute outing** that skips complex museums in favor of an open green lawn.

Rather than removing parental judgment, **SPARK (Smart Personalized Activity Routes for Kids)** implements a **Human-in-the-Loop Visual Analytics paradigm** [18, 19]. The fast algorithmic solver (<15ms) acts as an invisible background engine, while an integrated **Split-Screen Dashboard Layout** (Coordinated Multiple Views) allows parents to visually interrogate, navigate, and steer multi-dimensional trade-offs in real time.

```mermaid
flowchart TD
    subgraph UI_Controls["Standard Web UI Controls Tier"]
        C1["<b>Address Autocomplete Bar</b><br>OSM Nominatim API + DTLA Preset Pills"]
        C2["<b>Persona Preset Filter Pills</b><br>Balanced | Active | Cognitive | Creative"]
        C3["<b>Time Budget Slider & Domain Dropdown</b><br>Time Budget (60–240m) · Domain Filter"]
    end

    subgraph StateBus["Centralized Reactive State Store & Dispatcher (<15ms)"]
        STATE["<b>Application State Store</b><br>Origin (lat, lon) · Active Persona · Budget · Active Selection · User Votes"]
    end

    subgraph CoordinatedViews["Five Standard Dashboard UI Components"]
        V1["<b>Component 1: Interactive Map View</b><br>OSM Leaflet Tiles · Domain Glyphs · Route Polyline"]
        V2["<b>Component 2: Skills Radar Chart</b><br>Target Need Polygon vs. Delivered Coverage Polygon"]
        V3["<b>Component 3: Score Breakdown Bar</b><br>Horizontal Stacked Factor Decomposition"]
        V4["<b>Component 4: Trade-Off Scatter Plot</b><br>Pareto Efficiency Curve (Drive Time vs. Dev Score)"]
        V5["<b>Component 5: Itinerary Timeline & Comparison Card</b><br>Activity Stepper Ribbon · Side-by-Side Comparison Matrix"]
    end

    UI_Controls -->|Input Events| STATE
    STATE -->|Triggers renderAllViews()| CoordinatedViews
    CoordinatedViews <-->|Bidirectional Brushing & Linking| STATE
```

---

## 2. Standard Web UI Component Mapping

To bridge visualization theory with industry-standard software engineering and web design systems (e.g., Nielsen Norman Group, Material Design, Carbon Design System), Table 1 maps each academic term to its standard web design counterpart:

### Table 1: Web UI Component Architecture & Technology Mapping

| Web UI Component Name | Common Design System Class | Code & Technology Used | Real-World Web Precedent |
| :--- | :--- | :--- | :--- |
| **Split-Screen Dashboard Layout** | `DashboardLayout` / `SplitPane` | CSS Grid & Flexbox; event-driven state store in `app.js` (`dispatchStateUpdate()`) | **Airbnb / Zillow** map + listing split pane |
| **Address Autocomplete & Location Bar** | `AddressAutocomplete` / `SearchBar` | HTML5 `<input>`; OpenStreetMap Nominatim REST API (`fetch()`); vectorized Haversine distance | **Uber / Lyft** "Where to?" pickup search |
| **Persona Preset Filter Pills** | `SegmentedControl` / `FilterChipGroup` | HTML5 `<button>` group with `.active` class toggles; state mutating click handlers | **Airbnb** category filter pills ("Beachfront", etc.) |
| **Interactive Map View** | `MapView` / `MapCanvas` | Leaflet.js (`L.map`, `L.tileLayer`, `L.circleMarker`, `L.polyline`); OSM Standard street tiles | **Google Maps** interactive pin & route canvas |
| **Skills Radar Chart (Spider Chart)** | `RadarChart` / `SpiderPlot` | D3.js v7 (`d3.scaleLinear`, `d3.lineRadial()`, `d3.curveLinearClosed`); dynamic SVG polygons | **FIFA / EA Sports FC** player skill hexagon |
| **Score Breakdown Progress Bar** | `StackedProgressBar` / `ScoreBreakdown` | D3.js v7 (`d3.scaleLinear`); horizontal SVG stacked `<rect>` blocks with travel penalty marker | **Credit Karma / FICO** score factor breakdown |
| **Trade-Off Scatter Plot & Efficiency Curve** | `ScatterPlot` / `TradeOffCurve` | D3.js v7 (`d3.scaleLinear`, `d3.line().curve(d3.curveStepAfter)`, `d3.area()`); SVG circles | **Wealthfront / Bloomberg** efficient frontier |
| **Itinerary Timeline & Activity Stepper** | `Timeline` / `Stepper` | D3.js v7 (`d3.scaleLinear`); proportional horizontal SVG ribbon blocks with transit badges | **Google Flights / TripIt** flight segment timeline |
| **Side-by-Side Comparison Matrix Card** | `ComparisonTable` / `BenchmarkCard` | HTML5 dynamic template literals in `renderItineraryAndScorecard()`; counterfactual diff logic | **Google Flights** Best vs. Cheapest matrix |
| **Thumbs Up/Down Feedback Widget** | `ThumbsRating` / `FeedbackWidget` | HTML5/SVG button listeners; browser `localStorage` persistence; JSON Blob export | **Netflix / ChatGPT** response feedback widget |

---

## 3. Detailed Breakdown of the Core Web UI Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                    SPARK WEB DASHBOARD LAYOUT                          │
├────────────────────────────────────────────────────────────────────────┤
│ [🏠 Address Autocomplete Input] [Pershing Sq] [Union Stn] [Budget: ━●─]│
│ [⚖️ Balanced] [🏃 Active] [🧠 Cognitive] [🎨 Creative] [Filter: All ▾] │
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │  Component 2: Skills Radar Chart   │
│                                   │          Motor (Physical)          │
│   Component 1: Interactive        │             10 ▲                   │
│          Map View                 │             │ / \  Delivered       │
│                                   │  Creative ──┼─────● Cognitive      │
│  • Domain-colored SVG markers     │  (Arts)     │    /                 │
│  • Numbered route polyline        │             │   ▼ Target Need      │
│  • Dynamic Home pin (🏠)          │          Social (Peer)             │
│                                   ├────────────────────────────────────┤
│                                   │  Component 3: Score Breakdown Bar  │
│                                   │  [Dev 60%][Age 25%][Pref 15%][-Pen]│
├───────────────────────────────────┴────────────────────────────────────┤
│  Component 4: Trade-Off Scatter   │  Component 5B: Comparison Card     │
│  Dev Score ▲                      │  Metric      | Baseline | SPARK    │
│         10 ┼             ┌──● S2  │  Total Time  | 150m     | 150m     │
│          8 ┼       ┌─────┘        │  Transit     | 35m      | 36m      │
│          6 ┼───────┘  ● S1        │  Domains     | 2 / 4    | 4 / 4 ★  │
│          0 ┴───────┬───────►      │  Score       | 24.0     | 33.0 ★   │
│            0       10   20m Drive │  Advantage:  | +37.5% Quality Gain │
├───────────────────────────────────┴────────────────────────────────────┤
│  Component 5A: Itinerary Timeline Ribbon [🚗 8m][Grand Park 60m][🚗 12m]│
└────────────────────────────────────────────────────────────────────────┘
```

---

### Component 1: Interactive Map View

#### What It Is
An interactive geographic map canvas that displays verified family destinations and the active sequenced outing loop.

#### Technical Implementation
* **Basemap Layer:** Rendered using **Leaflet.js** on official OpenStreetMap Standard Street tiles (`tile.openstreetmap.org`) with sub-pixel rendering.
* **Domain-Colored Venue Pins:** 48 verified venues in Downtown Los Angeles from `poi.db` are plotted as custom SVG circle markers:
  - *Color Palette:* High-contrast accessible hues (Motor = `#38bdf8` Cyan, Cognitive = `#a78bfa` Violet, Social = `#34d399` Emerald, Creative = `#fbbf24` Amber).
  - *Marker Size:* Dynamically scaled by composite developmental score ($r \in [6\text{px}, 14\text{px}]$).
  - *Origin Anchor (`🏠`):* High-visibility home icon positioned via address geocoding.
* **Numbered Route Polyline:** Displays the active itinerary sequence ($1 \to 2 \to 3 \to \text{Home}$) in royal blue with dashed transit segments.
* **Popup Cards:** Clicking any marker reveals venue dwell time, verified activities, and an embedded **Thumbs Up/Down Feedback Widget**.

#### Popular Web Example
* **Google Maps / Apple Maps Search:** Interactive map view with category-colored pins, route polylines, and expandable venue detail cards.

---

### Component 2: Address Autocomplete & Location Bar

#### What It Is
A top-bar navigation input that resolves human-readable addresses or landmark names into spatial coordinates and recalculates driving routes.

#### Technical Implementation
* **Free-Form Text Input:** Caregivers enter residential addresses or landmarks ("Echo Park Lake", "Grand Park", "Pershing Square").
* **OpenStreetMap Nominatim Geocoding:** Converts text queries asynchronously into latitude and longitude coordinates $(\phi_0, \lambda_0)$ without requiring proprietary Google Maps billing keys.
* **Quick-Select Preset Filter Pills:** One-click shortcut buttons for 6 key Downtown Los Angeles landmarks (Pershing Square, Union Station, Grand Park, Crypto.com Arena, Echo Park, Arts District) that bypass network lookup latency.
* **Reactive Route Recalculation:** Re-anchors the home pin (`🏠`), updates pairwise Haversine driving distances, and triggers sub-15ms route re-sequencing.

#### Popular Web Example
* **Uber / Lyft "Where to?" Search Bar:** Address input with real-time autocomplete suggestions and preset shortcuts (Home, Work, Recent).
* **Zillow / Redfin Commute Location Input:** Setting an address to recalculate driving times from all available properties.

---

### Component 3: Persona Preset Filter Pills (Segmented Control)

#### What It Is
A horizontal group of one-click segmented control buttons that instantly adjust the optimization weights based on child profile and parental intent.

#### Technical Implementation
* **Four Persona Presets:**
  1. **⚖️ Balanced (Age 5):** Equal multi-domain weighting across Motor (8.0), Cognitive (7.5), Social (8.0), and Creative (7.5).
  2. **🏃 Active (Age 5):** High gross motor (9.5) and social play (8.5) $\to$ prioritizes athletic fields, obstacle courses, and splash pads.
  3. **🧠 Cognitive (Age 5):** High curiosity (9.5) $\to$ prioritizes historic heritage landmarks, Central Library storytelling, and puzzle exhibits.
  4. **🎨 Creative (Age 5):** High imaginative arts (9.5) $\to$ prioritizes botanical gardens, sensory sculpture, and craft workshops.
* **Instant State Mutation:** Clicking a pill updates the state store and reshapes the radar chart and venue recommendations in $<15\text{ ms}$.

#### Popular Web Example
* **Airbnb Category Filter Pills:** Top-bar pill buttons ("Beachfront", "Cabins", "Trending", "Play") that instantly filter available vacation stays.
* **E-Commerce Sort & Persona Filters:** "Best Seller", "Budget", "Premium" preset tabs.

---

### Component 4: Skills Radar Chart (Spider Chart)

#### What It Is
A 4-axis polar coordinate chart that visualizes a child’s developmental baseline needs compared against the cumulative domain points delivered by the active itinerary.

#### Technical Implementation
* **Polar Coordinate Mapping:** Built with **D3.js (v7)** using `d3.lineRadial()` and `d3.scaleLinear().domain([0, 10]).range([0, radius])` across 4 orthogonal axes ($\theta_i \in \{0, \frac{\pi}{2}, \pi, \frac{3\pi}{2}\}$): Motor, Cognitive, Social, and Creative.
* **Target Need Polygon (Dotted Amber):** Visualizes the baseline requirements for the active child persona.
* **Delivered Coverage Polygon (Cyan Shaded Fill):** Displays the cumulative developmental points earned by the active route stops.
* **Gap Analysis:** Instantly highlights "domain starvation" or surplus: if any quadrant of the cyan polygon falls inside the dotted amber baseline, the parent immediately sees which developmental domain is neglected.

#### Popular Web Example
* **FIFA / EA Sports FC Player Skill Hexagon:** Comparing a player's attributes (Pace, Shooting, Passing, Dribbling, Defending, Physical) against team requirements.
* **Pokémon Base Stats Chart:** Visualizing Pokémon attributes across HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed.

---

### Component 5: Score Breakdown Progress Bar

#### What It Is
A horizontal segmented progress bar that visually explains the mathematical factors comprising a venue's composite recommendation score.

#### Technical Implementation
* **Explainable Decomposition:** Breaks down the linear scoring equation:
  $$\text{Score}(v) = 0.60 \times \text{DevFit} + 0.25 \times \text{AgeFit} + 0.15 \times \text{Pref} + \text{DiversityBonus} - \text{TravelPenalty}$$
* **Visual Segments:** Rendered with `d3.scaleLinear()`, stacking positive components from left to right (Cyan for DevFit, Violet for AgeFit, Emerald for Caregiver Pref, Amber for Diversity Bonus).
* **Deduction Marker:** Displays the travel transit friction penalty as an offset red segment with a dashed deduction marker, explaining why distant stops receive lower rankings.

#### Popular Web Example
* **Credit Karma / FICO Score Breakdown:** Dissecting a credit score into Payment History, Utilization, Credit Age, and Inquiry deductions.
* **Fitness Tracker Strain Bars (Apple Health / Whoop):** Segmented bar breaking down daily calorie burn into cardio, strength, and resting metabolic rate.

---

### Component 6: Trade-Off Scatter Plot & Efficiency Curve

#### What It Is
An interactive Cartesian scatter plot displaying the non-dominated Pareto efficiency curve between driving transit time (minimize) and developmental enrichment score (maximize).

#### Technical Implementation
* **Axes:** X-Axis = Driving Transit Time ($0\text{--}15\text{ mins}$); Y-Axis = Composite Developmental Score ($0\text{--}10\text{ pts}$).
* **Pareto Step-Curve:** Rendered using `d3.line().curve(d3.curveStepAfter)` and `d3.area()` to shade the feasible trade-off frontier.
* **Candidate Scatter Points:** Every candidate venue in the corridor is plotted as a background circle; active stops on the current route are highlighted as pulsing badges directly along the efficiency curve.
* **Trade-Off Navigation:** Parents can hover over adjacent non-dominated points to see if driving **3 more minutes** yields a non-linear jump in activity enrichment.

#### Popular Web Example
* **Investment Efficient Frontier (Wealthfront / Bloomberg):** Plotting asset portfolios along a Risk (volatility) vs. Expected Return frontier.
* **Cloud Infrastructure Optimization (AWS / Datadog):** Graphing Cost per Hour (\$) against Request Throughput / Latency (QPS).

---

### Component 7: Itinerary Timeline & Activity Stepper

#### What It Is
A horizontal chronological timeline bar showing the sequence and duration of travel legs and venue dwell intervals.

#### Technical Implementation
* **Proportional Ribbon:** Built with `d3.scaleLinear().domain([0, totalMins]).range([0, containerWidth])`.
* **Alternating Blocks:** Renders alternating colored blocks:
  - *Driving Transit Legs:* Compact gray badges (`🚗 8m`, `🚗 12m`).
  - *Venue Dwell Periods:* Proportional colored blocks (`Grand Park: 60m`, `Central Library: 50m`).
* **Schedule Feasibility:** Gives parents immediate situational awareness of when the outing begins, how long children remain in the car, and when the family returns home.

#### Popular Web Example
* **Google Flights / TripIt Itinerary Stepper:** Horizontal flight timeline showing departure, layover blocks, flight legs, and arrival times.
* **FedEx / Amazon Delivery Timeline:** Step-by-step progress stepper tracking milestone events.

---

### Component 8: Side-by-Side Comparison Matrix Card

#### What It Is
A 2-column comparative scorecard that directly compares the optimized SPARK route against a conventional **Nearest-Neighbor Baseline**.

#### Technical Implementation
* **Counterfactual Comparison:** Evaluates both routes across four identical metrics:
  1. *Total Outing Duration:* Verifies budget compliance (150 mins vs 150 mins).
  2. *Transit Driving Time:* Audits driving circuity overhead (+1 min extra driving, 36m vs 35m).
  3. *Domains Covered:* Directly proves elimination of domain starvation (4/4 domains vs 2/4 in baseline).
  4. *Total Composite Score:* Quantifies enrichment gain (33.0 pts vs 24.0 pts).
* **Empirical Advantage Banner:** Computes and highlights the percentage quality gain (**+37.5% Quality Gain**).

#### Popular Web Example
* **Google Flights Flight Matrix:** Side-by-side comparison cards comparing "Best Flight" vs. "Cheapest" vs. "Fastest".
* **E-Commerce Product Compare Table:** Side-by-side spec comparison table (e.g., iPhone 15 vs. iPhone 15 Pro).

---

### Component 9: Thumbs Up/Down Feedback Widget

#### What It Is
An interactive micro-feedback voting module embedded within venue popups and detail cards.

#### Technical Implementation
* **Clickable Upvote / Downvote Buttons:** `👍` and `👎` icons on overall venue recommendations and individual activities.
* **Live In-Situ Counter:** Top navigation bar displays running feedback totals (`Model Eval: N votes (% positive)`).
* **Structured JSON Export:** Clicking **"Export Eval Data"** downloads `spark_model_evaluation.json` directly from the browser for offline quantitative model assessment.

#### Popular Web Example
* **Netflix / YouTube Recommendation Rating:** Thumbs up / thumbs down controls to tune recommendation algorithms.
* **ChatGPT / AI Assistant Response Feedback:** Upvote/downvote icons at the bottom of generated responses.

---

## 4. Software Implementation Details & Zero-Config Reproducibility

* **Zero Build Overhead:** The entire visualization stack is delivered as pure static HTML5, CSS3, D3.js (v7 CDN), and Leaflet.js (v1.9.4 CDN), requiring no Node.js compilation, npm dependencies, or paid API keys.
* **Sub-15ms Performance Benchmark:** All D3 SVG re-renders and Leaflet DOM canvas updates execute in **under 15 milliseconds**, guaranteeing 60fps responsiveness during slider dragging and persona toggling.
* **Single Command Local Hosting:**
  ```bash
  cd spark/presentation && python3 -m http.server 8080
  ```

---

### References
* `[12]` Shafqat & Byun, *Sustainability*, 2020.
* `[15]` Psyllidis et al., *Comput. Urban Sci.*, 2022.
* `[18]` Shneiderman, *Proc. IEEE Symposium on Visual Languages*, 1996.
* `[19]` Munzner, *Visualization Analysis and Design*, CRC Press, 2014.
