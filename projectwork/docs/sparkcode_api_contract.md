# SPARK Optimizer: API Contract

---

## Summary

The contract connects two halves of our project:
- **Input (from the parent):** Starting address or coordinates, child's age, how far they are willing to travel, and how many stops they want.
- **Output (to the UI):** An ordered list of age-appropriate venues and activities, their map pins, and developmental scores for our D3 radar chart.

---

## 1. What the Optimizer Does

When a parent asks for an outing, the algorithm balances three goals:

1. **Child Milestones (Quality):** Looks up what skills matter most for the child's age (social-emotional, motor skills, creativity, cognitive learning) from `age_points`. It uses diminishing returns so it doesn't give a child three identical physical activities in a row.
2. **Travel Convenience (Proximity):** Penalizes venues that are too far from home so parents don't spend the whole day in traffic.
3. **Variety (No Redundancy):** Uses profile similarity to ensure activities complement each other (e.g. a high-energy park paired with a creative library visit).

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
  "child_age": 5.0,            // Child's age in years (used for pediatric milestone weights)
  "radius_miles": 3.0,         // Search radius from starting point (default: 3.0)
  "n_activities": 2,           // Number of stops wanted (default: 2)
  "distance_penalty": 0.10,    // Higher value keeps stops closer to home
  "redundancy_penalty": 0.10   // Higher value forces more diverse activity types
}
```

---

## 3. API Response: What the UI Renders

The backend returns a clean JSON package with three sections:

```json
{
  "status": "success",

  // 1. High-level summary for badges and scorecard comparisons
  "summary": {
    "objective_value": 0.517,
    "development_value": 0.542,
    "distance_cost": 0.038,
    "redundancy_score": 0.0,
    "unique_activities": 2,
    "unique_pois": 2
  },

  // 2. Developmental scores for the D3 Radar Chart
  "developmental_coverage": {
    "soc_emot":       { "name": "Social-Emotional",           "age_weight": 0.14, "coverage": 0.61 },
    "cog_exec":       { "name": "Cognitive & Executive",      "age_weight": 0.13, "coverage": 0.54 },
    "lang_comm":      { "name": "Language & Communication",   "age_weight": 0.14, "coverage": 0.54 },
    "phys_motor":     { "name": "Physical & Motor",           "age_weight": 0.13, "coverage": 0.36 },
    "expl_creat":     { "name": "Exploration & Creativity",   "age_weight": 0.14, "coverage": 0.54 },
    "found_knowl":    { "name": "Foundational Knowledge",     "age_weight": 0.11, "coverage": 0.57 },
    "ind_lifeskills": { "name": "Independence & Life Skills", "age_weight": 0.11, "coverage": 0.49 },
    "health":         { "name": "Health & Wellness",          "age_weight": 0.11, "coverage": 0.51 }
  },

  // 3. Sequenced itinerary for the Leaflet Map and Activity Cards
  "agenda": [
    {
      "selection_order": 1,
      "id": 468790197,
      "name": "Spring Street Community Garden",
      "type": "garden",
      "activity": "build sand castle",
      "distance_miles": 0.11,
      "latitude": 34.048295,
      "longitude": -118.253532,
      "factor_scores": {
        "soc_emot": 9, "cog_exec": 7, "lang_comm": 7, "phys_motor": 8,
        "expl_creat": 9, "found_knowl": 8, "ind_lifeskills": 7, "health": 7
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

---

## 4.  Notes

1. **The Inverted Coordinates Quirk in `poi.db`:**
   In the raw SQLite `pois` table, the column named `latitude` contains negative longitude numbers (like `-118.25`), and `longitude` contains positive latitude numbers (like `34.04`). The data loader swaps these back so coordinates plot in Los Angeles rather than Antarctica.
2. **The "Whichever Is Least" Rule:**
   If a parent asks for 4 stops but only 2 venues exist within their chosen 0.5-mile circle, the app caps the itinerary at 2 stops instead of throwing an error or crashing.
3. **Offline / Standalone Fallback:**
   The frontend in `spark/app.js` has its own built-in heuristic evaluator. If no Python API server is running, the webapp continues working 100% offline.

---

## 5. UI Ideas

- **Target vs. Actual Radar:** Show a dashed target polygon (what a 5-year-old needs today) compared to the solid polygon (what this outing provides), making it immediately obvious where the gaps are.
- **Reroll / Swap Stop Button:** If a parent likes Stop 1 and Stop 2 but their child hates sandcastles at Stop 3, a single "Swap" button lets them reroll only that stop without throwing away the whole route.
- **Pacing Curve (Energy Flow):** Put high-energy playground games first in the morning when the kids have energy, and quiet picnic or library storytelling in the afternoon when they're winding down.
- **Rainy / Hot Day Toggle:** A one-click toggle to restrict suggestions to air-conditioned, indoor spots like museums and libraries during extreme heat or rain.
