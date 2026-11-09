# Smart Personalized Activity Routes for Kids (SPARK) — Progress Report

**Team 61:** Jay Mangrulkar, Max Jarosch, Katherine Liang, Manoj Achari, Shanmugam Murugappan  
**Course:** CSE 6242: Data & Visual Analytics  
**Semester:** Fall 2026  

---

## Abstract

Planning a day out with kids can be exhausting. Parents want fun, enriching activities tailored to their child's age, but they also have to juggle driving times, family schedules, and avoiding travel fatigue. **SPARK (Smart Personalized Activity Routes for Kids)** is an interactive web tool that takes the friction out of daily planning. By pairing local map data from OpenStreetMap with child-development guidelines, SPARK builds practical, multi-stop day trips tailored to a child’s developmental stage and a family's travel limits. This progress report outlines our project goals, system design, current build progress, and evaluation plan.

---

## 1. Introduction & Problem Definition

Anyone who has planned a weekend with young children knows the headache: parents often spend an hour toggling between Google Maps, review sites, and family calendars, trying to piece together outings that keep kids engaged without exhausting everyone [1, 2]. 

Existing tools do not solve this problem well. Commercial map platforms treat playgrounds the same as retail stores—they show locations, but know nothing about whether an activity is age-appropriate or how multiple stops fit together into a realistic day. Digital calendars track hours, but lack spatial awareness. Parents are left doing all the mental heavy lifting. 

SPARK bridges this gap by turning trip planning into an interactive, visual dashboard. Instead of giving parents a generic list of nearby spots, it creates balanced daily itineraries that combine healthy child development with convenient, realistic driving routes.

---

## 2. Literature Survey

### Theme 1: Child Development & Caregiver Stress
Pediatric research shows that children benefit greatly from a balanced mix of active play, sports, outdoor exploration, and creative activities [3–9]. These experiences build motor skills, emotional resilience, and cognitive ability, encouraging active lifestyles that continue into adulthood [9]. However, when parents feel stressed by planning logistics, their activity choices often become rigid or repetitive [7, 8]. SPARK aims to lighten this mental load by suggesting varied, age-appropriate schedules that support multiple developmental areas.

### Theme 2: Recommendation Systems & Map Interfaces
Location-aware recommendation systems work best when they incorporate distance, user preferences, and real-world travel constraints [10, 11]. OpenStreetMap offers a rich, community-driven catalog of local points of interest (POIs) [12, 13]. Meanwhile, simple route optimization heuristics [14] and clean, interactive map interfaces [15, 16] help parents make quick, confident decisions without getting lost in complex menus.

---

## 3. Proposed Methods

SPARK combines an algorithmic recommendation engine with an interactive web dashboard.

### 3.1 Data Extraction & Preparation
We extracted local venue data from OpenStreetMap using GeoPandas and loaded it into a local SQLite database. We focused on child-friendly locations—including parks, playgrounds, nature centers, museums, and recreation spaces—recording their names, categories, and geographic coordinates.

### 3.2 Datasets & Candidate Generation
SPARK links four core datasets:
1. **Local POIs:** Venue names, coordinates, and categories.
2. **Activity Mappings:** Linking venue types to what children do there (e.g., active play, arts, sensory exploration).
3. **Developmental Scores:** Ratings (1–10) across eight developmental domains (cognitive, motor, social, creative, language, etc.) based on CDC and Harvard Center on the Developing Child guidance [17, 18].
4. **Age Profiles:** Importance weights for ages 2 through 12, ensuring recommendations adapt as children grow.

When a parent enters a home address, the app calculates distances to nearby venues using the Haversine formula, keeps places within the chosen travel radius (1–10 miles), and joins them with developmental scores to form candidate stops.

### 3.3 Multi-Objective Activity Selection
Rather than simply picking the closest stops or the highest-rated spots, SPARK balances three competing priorities:

$$J(S) = D(S) - \delta L(S) - \mu R(S)$$

* **Developmental Coverage $D(S)$:** Rewards activities matching the child’s age priorities, using a concave diminishing-returns curve ($1 - e^{-T/\tau}$) across eight pediatric domains so schedules stay diverse rather than repeating the same activity type.
* **Travel Penalty $L(S)$:** Combines radial distance from the origin with pairwise inter-venue dispersion ($0.35 \times \text{radial} + 0.65 \times \text{pairwise}$). This penalizes geographically scattered star/spoke routes across town and clusters candidate stops into a compact, cohesive driving circuit.
* **Redundancy Penalty $R(S)$:** Penalizes visiting repetitive venues (e.g., two playgrounds in one morning) using mean centered cosine similarity across selected activity vectors to ensure variety.
* **Weights $\delta$ and $\mu$:** Adjust the balance between travel convenience and activity variety.

We use a simulated annealing metaheuristic (2,500 iterations in web mode, <15ms) to explore combinations and find an optimal, feasible itinerary in a fraction of a second.

### 3.4 Web Dashboard & User Interaction
The SPARK UI is a two-panel dashboard built with Leaflet.js, D3.js, a local SQLite database, and is hosted through a lightweight Python server. Parents enter a starting address, child’s age, travel radius, and desired number of activities:
* **Left Panel (Itinerary & Timeline):** Displays the recommended itinerary with a D3 timeline balancing driving time against activity dwell time, venue details, and thumbs up/down feedback buttons.
* **Right Panel (Interactive Map):** Shows an interactive OpenStreetMap canvas with color-coded destinations. To ensure practical driving directions, the UI executes an exact permutation search ($K \le 7$) and 2-Opt local search ($K > 7$) to sequence stops into a minimal-distance round trip, overlaid with turn-by-turn road network curves fetched via OpenStreetMap OSRM.
* **Interactivity & Logging:** Users can explore recommendations on either the map or itinerary view, upvote or downvote activities, and instantly see updated routes when trip settings change without a page reload. This user feedback is logged into a dedicated SQLite table (`user_evaluations`) to evaluate and improve recommendations.

---

## 4. Innovations

SPARK introduces two practical innovations:

1. **Age-Weighted Developmental Scoring:** We translate qualitative pediatric guidelines into a quantitative scoring model that automatically shifts priorities as a child grows from toddler to pre-teen.
2. **Development-Aware Route Optimization:** Traditional navigation tools only minimize travel time, while review apps only rank by popularity. SPARK bridges both by optimizing for developmental balance, diversity, and travel convenience all at once.

---

## 5. Evaluation Plan

We are evaluating SPARK in two practical ways:

* **In-App Feedback & Performance Tuning:** Each venue card includes thumbs up/down buttons that log parent ratings and solver runtimes directly to our SQLite database. We use this data to refine our developmental scores, adjust the trade-off weights between distance and variety ($\delta$ and $\mu$), and ensure route calculations stay fast and responsive.
* **Parent User Study (N = 10):** Each team member will have two parents or caregivers test the live tool for realistic day trips. Participants will rate the app on a 1–10 scale across recommendation quality, practicality, scheduling usefulness, map clarity, and ease of use, comparing the experience against manual planning in Google Maps.

---

## 6. Plan of Activities

The table below outlines our original plan, updated schedule, and current milestone progress.

| Activity | Owner(s) | Old Timeline | New Timeline | Old Status | New Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Literature Review & Project Design** | All | 9/21 – 10/4 | 9/21 – 10/4 | Done | **Done** |
| **Identification of Datasets** | Max, Manoj, Shan | 9/28 – 10/12 | 9/28 – 10/12 | Done | **Done** |
| **Data Wrangling & Model Selection** | Max, Manoj, Shan | 10/5 – 10/25 | 10/5 – 10/25 | In Progress | **Done** |
| **Develop Initial Models and UI** | Shan, Manoj | 10/25 – 11/15 | 10/25 – 11/15 | Not Started | **In Progress** |
| **Integrate Models into UI** | Shan, Manoj | 11/9 – 11/22 | 10/28 – 11/22 | Not Started | **In Progress** |
| **Model Evaluation and Testing** | Jay, Katherine | 11/16 – 11/29 | 11/1 – 11/22 | Not Started | **In Progress** |
| **User Surveys and Feedback** | Jay, Katherine | *N/A (New)* | 11/22 – 11/29 | Not Started | **Not Started** |
| **Final Report & Poster Development** | All | 11/23 – 12/3 | 11/23 – 12/3 | Not Started | **Not Started** |

All team members have contributed a similar amount of effort thus far and are expected to continue contributing equally throughout the remainder of the project.

---

## 7. References

[1] A. C. Weeks and L. Ruppanner, "A typology of US parents' mental loads: Core and episodic cognitive labor," *Journal of Marriage and Family*, vol. 87, no. 1, pp. 85–104, 2025.  
[2] M. Kremer-Sadlik, C. Izquierdo, and M. Fatigante, "Making meaning of everyday practices: Parents' attitudes toward children's extracurricular activities," *Anthropology & Education Quarterly*, vol. 41, no. 1, pp. 35–54, 2010.  
[3] M. Yogman, A. Garner, J. Hutchinson, K. Hirsh-Pasek, and R. M. Golinkoff, "The Power of Play: A Pediatric Role in Enhancing Development in Young Children," *Pediatrics*, vol. 142, no. 3, p. e20182058, 2018.  
[4] R. M. Eime, J. A. Young, J. T. Harvey, M. J. Charity, and W. R. Payne, "A systematic review of the psychological and social benefits of participation in sport for children and adolescents," *International Journal of Behavioral Nutrition and Physical Activity*, vol. 10, no. 1, p. 98, 2013.  
[5] E. Theodotou, "Supporting personal and social development through child-led art projects in the early years settings," *Early Child Development and Care*, vol. 188, no. 7, pp. 912–924, 2019.  
[6] I. Jarvis, R. Sbihi, M. Davis, M. Brauer, A. Suen, and M. Jerrett, "Neighborhood playability and early childhood development: A population-based birth cohort study," *Environmental Research*, vol. 240, p. 117462, 2026.  
[7] B. E. Oliver, R. J. Nesbit, and H. F. Dodd, "Parent perceived barriers and facilitators of children's adventurous play: A framework analysis," *BMC Public Health*, vol. 22, no. 1, p. 804, 2022.  
[8] R. Hosokawa and T. Katsura, "Association between parents' perceived social support and children's psychological adjustment," *BMC Pediatrics*, vol. 24, no. 1, p. 112, 2024.  
[9] D. L. Vandell and Z. Gulseven, "Organized extracurricular activities, developmental outcomes, and lifelong habits," *Child Development Perspectives*, vol. 14, no. 4, pp. 228–234, 2020.  
[10] W. Shafqat and Y.-C. Byun, "A context-aware location recommendation system for tourists using hierarchical LSTM model," *Sustainability*, vol. 12, no. 10, p. 4049, 2020.  
[11] H. A. Rahmani, M. Aliannejadi, S. Mitra, and F. Crestani, "A systematic analysis on the impact of contextual information on point-of-interest recommendation," *ACM Transactions on Information Systems*, vol. 41, no. 2, pp. 1–35, 2022.  
[12] M. Haklay, "How good is volunteered geographical information? A comparative study of OpenStreetMap and Ordnance Survey datasets," *Environment and Planning B: Planning and Design*, vol. 37, no. 4, pp. 682–703, 2010.  
[13] A. Psyllidis, V. Gao, B. S. Lim, Y. Kim, and M. Bozzon, "Points of Interest (POI): A commentary on the state of the art, challenges, and prospects for the future," *Computational Urban Science*, vol. 2, no. 1, pp. 1–19, 2022.  
[14] K. Helsgaun, "An effective implementation of the Lin-Kernighan traveling salesman heuristic," *European Journal of Operational Research*, vol. 126, no. 1, pp. 106–130, 2000.  
[15] C. Neustaedter, A. J. B. Brush, and S. Greenberg, "The calendar is crucial: Coordination and awareness through the family calendar," *ACM Transactions on Computer-Human Interaction*, vol. 16, no. 1, pp. 1–48, 2009.  
[16] M. Bartling, T. H. Unger, and B. Resch, "The role of user context in the design of mobile map applications," *Cartography and Geographic Information Science*, vol. 48, no. 5, pp. 416–431, 2021.  
[17] Centers for Disease Control and Prevention (CDC), "Developmental Milestones Guidelines," *U.S. Department of Health and Human Services*, 2023. [Online]. Available: https://www.cdc.gov/ncbddd/actearly/milestones/  
[18] Center on the Developing Child at Harvard University, "A Science-Based Framework for Early Childhood Policy and Practice," *Harvard University*, 2020. [Online]. Available: https://developingchild.harvard.edu/
