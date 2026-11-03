# Smart Personalized Activity Routes for Kids (SPARK) — Progress Report

**Team 61:** Jay Mangrulkar, Max Jarosch, Katherine Liang, Manoj Achari, Shanmugam Murugappan  
**Course:** CSE 6242: Data & Visual Analytics | **Semester:** Fall 2026  

---

## Abstract

SPARK (Smart Personalized Activity Routes for Kids) is an interactive tool that helps parents and caregivers discover nearby child-friendly activities and generate personalized daily itineraries. By combining geographic data, developmental research, and route optimization, SPARK recommends activities that align with a child’s developmental stage while considering practical constraints such as distance and travel time. This report summarizes the project’s motivation, methodology, progress, and evaluation plan.

---

## Introduction

Parents often face challenges balancing children's developmental needs with family schedules and geographic constraints. While existing tools support activity discovery or schedule management, they rarely integrate developmental priorities with practical planning. SPARK addresses this gap by combining geographic information, age-specific developmental scoring, and route optimization to generate personalized activity itineraries tailored to a child's developmental needs.

---

## Problem Definition

Parenting involves substantial planning effort, including identifying meaningful activities, coordinating schedules, and considering long-term developmental goals [1]. Although many applications help families find activities or manage calendars, few combine developmental guidance with location-aware planning. SPARK aims to bridge this gap by recommending nearby activities that collectively support a child's development while remaining convenient for caregivers.

---

## Literature Survey

### Theme 1: Child Development and Caregiver Needs
Research shows that activities such as active play, sports, outdoor exploration, and creative experiences contribute to children's cognitive, social-emotional, and physical development [3–9]. Studies also suggest that organized extracurricular participation supports long-term academic, behavioral, and social outcomes. These findings motivate SPARK's focus on creating balanced activity schedules that support multiple areas of development.

### Theme 2: Recommendation Systems and Geographic Planning
Prior research demonstrates that context-aware recommendation systems benefit from incorporating factors such as location, distance, and user preferences [10, 11]. OpenStreetMap provides a valuable source of geographic point-of-interest (POI) data [12, 13], while route optimization algorithms and map-based interfaces improve practical trip planning and decision-making [14–16].

---

## Proposed Methods

### Data Extraction and Preparation
POI data was extracted from OpenStreetMap and loaded into SQLite using GeoPandas. Relevant child activity locations were identified and converted into representative latitude and longitude coordinates for downstream analysis.

### Data Integration and Candidate Generation
SPARK integrates four datasets:
* Local POIs with geographic coordinates and categories
* Category-to-activity mappings
* Activity scores across developmental factors
* Age-specific developmental priority weights

The user’s starting address is geocoded into latitude and longitude coordinates. The Haversine formula is then used to calculate distances between the starting location and nearby POIs. Locations within the selected radius are retained and linked with developmental activity data to generate candidate recommendations.

### Age-Specific Developmental Scoring
Activities are evaluated across eight developmental dimensions derived from guidance from the CDC, Harvard Center on the Developing Child, California Infant-Toddler Learning, and Head Start frameworks [17, 18]. Activity scores are normalized and combined with age-specific developmental weights, allowing recommendations to adapt to the developmental priorities of children at different ages.

### Multi-Objective Activity Selection
To generate balanced itineraries rather than simply selecting the highest-scoring activities, SPARK uses a diversity-aware optimization model:

$$J(S) = D(S) - \delta L(S) - \mu R(S)$$

Where:
* $D(S)$ represents developmental coverage,
* $L(S)$ represents travel distance penalties,
* $R(S)$ represents activity redundancy penalties.

The model seeks activities that collectively maximize developmental coverage while minimizing travel distance and overlap between recommendations.

Simulated annealing is used to efficiently search for high-quality activity combinations while satisfying itinerary constraints. The result is a set of geographically relevant and developmentally complementary activities tailored to the user’s preferences.

### Visualization and User Interaction
The SPARK interface features a two-panel dashboard built with Leaflet.js, D3.js, and a local SQLite database, hosted through a lightweight Python server. Parents enter their home address, child’s age, travel radius, and desired number of stops. The dashboard displays a recommended itinerary alongside an interactive OpenStreetMap showing color-coded destinations and the suggested route. Users can explore recommendations, provide feedback on activities, and instantly see updated results when trip settings change.

---

## Innovations

### Innovation 1: Age-Weighted Developmental Scoring
SPARK introduces a quantitative framework that transforms child-development research into personalized activity recommendations. By combining developmental scores with age-specific priorities, the system adapts recommendations as a child grows.

### Innovation 2: Development-Aware Route Optimization
Unlike traditional activity recommendation platforms, SPARK combines developmental scoring, location information, and optimization techniques to create complete activity itineraries. Recommendations are selected not only for individual quality but also for their ability to provide balanced developmental coverage while remaining geographically practical.

---

## Evaluation

We plan to evaluate SPARK using feedback from 10 participants. Users will generate activity schedules and assess recommendation quality, usability, practicality, map usefulness, and overall satisfaction using a 1–10 rating scale. Participants will also compare the SPARK experience with manual planning using traditional map applications. Results will be used to refine both the recommendation model and user interface.

---

## Plan of Activities

| Activity | Owner(s) | New Timeline | Status |
| :--- | :--- | :---: | :---: |
| Literature review & project design | All | 9/21 – 10/4 | Done |
| Identification of datasets | Max, Manoj, Shan | 9/28 – 10/12 | Done |
| Data wrangling and model selection | Max, Manoj, Shan | 10/5 – 10/25 | Done |
| Develop initial models and UI | Shan, Manoj | 10/25 – 11/15 | In Progress |
| Integrate models into UI | Shan, Manoj | 10/28 – 11/22 | In Progress |
| Model evaluation and testing | Jay, Katherine | 11/1 – 11/22 | In Progress |
| User surveys and feedback | Jay, Katherine | 11/22 – 11/29 | Not Started |
| Final report and poster development | All | 11/23 – 12/3 | Not Started |

All team members have contributed similar levels of effort thus far and are expected to continue contributing throughout the remainder of the project.
