# Smart Utility Planner: Project Proposal

## 1. Abstract & Core Concept (Heilmeier Q1, Q4, Q7)

**(Heilmeier Q1 - What are you trying to do?)** We propose the *Smart Utility Planner*, an interactive visual analytics decision-support system that enables urban residents, families, and transport researchers to explore, analyze, and optimize the spatiotemporal frictions of recurring weekly errands (e.g., groceries, healthcare, auto care). Rather than acting as an opaque, autonomous planner, our system functions as an exploratory visual lens. It synthesizes empirical venue visit propensity curves, continuous arterial traffic speeds, and local weather patterns to visually expose cross-category crowding synchrony and allow users to interactively inspect multi-objective tradeoffs between transit duration, venue crowding, and calendar fragmentation. 

**(Heilmeier Q4 - Who cares?)** This platform addresses a significant pain point for urban households, working parents, commuters, and transportation researchers seeking to understand and mitigate the spatiotemporal congestion frictions in everyday recurring errands. 

**(Heilmeier Q7 - How much will it cost?)** The project relies entirely on free, publicly accessible government and open academic datasets (Yelp Open Dataset, Chicago Traffic Tracker, OSM, NOAA), requiring exactly $0 in financial expenditure.

## 2. Literature Survey & The Problem Today (Heilmeier Q2)

**(Heilmeier Q2 - How is it done today, and what are the limits?)** Until now, most of the planning for urban mobility and Point of Interest (POI) visitation has been evaluated either at the macro-level for infrastructure planning [Davis, for Los Angeles] [Zimmerman, Minnesota] or treated as single-drive point-in-time routing by commercial navigation engines. Modern navigation engines (Google Maps, Waze) optimize routing for an immediate, isolated trip [Chen et al., 2023]. They cannot forecast destination crowd levels across an upcoming week, nor can they coordinate multi-activity weekly schedules across diverse household destinations.

Furthermore, existing academic route optimization tools often output a single "optimal" schedule without explaining the underlying compromises. Zhang et al. (2022) explored spatial-temporal POI embeddings to predict visitor flow, demonstrating strong correlations between check-in densities and physical occupancy. However, their models functioned strictly as predictive engines rather than exploratory visual tools. Strummer and Jones [12] estimated significant reductions in travel time through dynamic route guidance, but their tools lacked the capability to balance travel time against venue crowding. Similarly, while Iommi and Butler [4] argued that multi-stop trip chaining provides a larger boost in efficiency per mile traveled for rural and suburban regions, digital calendar apps remain passive chronological repositories with zero analytical context regarding destination crowd dynamics. 

Our project leverages the foundational POI visit propensity modeling by Wang et al. (2020) and Gionis et al. (2021), whose methodologies for predicting temporal visitation harmonically account for $\sim70\%$ of diurnal variance. By combining this with the continuous arterial traffic flow concepts from Lee et al. (2023), we build a tested foundation that visually exposes multi-objective tradeoffs instead of hiding them behind a black-box solver.

## 3. Innovation, Impact, & Risks (Heilmeier Q3, Q5, Q6)

**(Heilmeier Q3 - What is new in your approach?)** In addition to innovating by fusing multi-million POI check-in distributions with continuous arterial traffic speeds and weather observations, we provide the planner with an interactive Pareto Frontier explorer. Instead of forcing a single automated schedule, our discrete skyline filter computes non-dominated schedules and renders them in a coordinated multi-view D3.js dashboard, allowing users to select their own priority weighting between time savings and crowd avoidance.

**(Heilmeier Q5 - How do you measure impact?)** The analytical impact will be measured via machine learning prediction accuracy on held-out test sets (targeting RMSE $\le 12.0$, $R^2 \ge 0.70$), arterial speed Mean Absolute Percentage Error (MAPE $\le 15\%$), and simulated weekly errand duration reduction ($\ge 18\text{-}24\%$ over baselines across 1,000 ATUS/NHTS-grounded household simulations). We also target an interaction latency of $<150\text{ms}$ grounded in HCI standards [Miller, 1968; Card et al., 1991] to ensure fluid interactive brushing across all visual views.

**(Heilmeier Q6 - What are the risks and payoffs?)** A primary risk is check-in sparsity for low-volume POIs and traffic sensor missingness. We mitigate this via a two-tier empirical Bayesian shrinkage approach toward category priors and cubic spline sensor imputation. The payoff is a highly defensible, practical visual decision-support tool that meaningfully bridges machine learning with urban mobility analytics.

## 4. Plan of Activities (Heilmeier Q8, Q9)

**(Heilmeier Q8 - How long will it take?)** The project will be executed over a 12-week phased schedule:
*   **Weeks 1-3 (Data Ingestion & Spatial Precomputation):** Extract Yelp check-ins and Chicago Traffic data into H3 hexagonal buckets; setup unified GeoParquet feature stores.
*   **Weeks 4-6 (Congestion Modeling & Skyline Engine):** Train LightGBM crowd congestion regressor ($P_{\text{visit}}(v, t)$) and implement branch-and-bound Pareto frontier search algorithm.
*   **Weeks 7-9 (Interactive D3 Visualization):** Architect the 3 coordinated D3.js views (Multi-Category Congestion Heatmap Matrix, Leaflet Accessibility Map, and Pareto Tradeoff Explorer).
*   **Weeks 10-12 (Baseline Evaluation & Final Reporting):** Run evaluation scripts reporting RMSE/MAE, prepare the final 6-page report and package software.

**(Heilmeier Q9 - What are the midterm and final "exams"?)** 
*   **Midterm Checkpoint:** Delivery of the cleaned spatial database joining Yelp check-ins and traffic data, alongside a baseline LightGBM congestion regressor and initial Leaflet map view.
*   **Final Submission:** Fully integrated 3-view coordinated D3.js visual analytics application with validated evaluation metrics, baseline comparisons, packaged code, and final team poster/videos.
