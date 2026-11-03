# Smart Personalized Activity Routes for Kids (SPARK) — Progress Report

**Team 61:** Jay Mangrulkar, Max Jarosch, Katherine Liang, Manoj Achari, Shanmugam Murugappan  
**Course:** CSE 6242: Data & Visual Analytics  
**Semester:** Fall 2026  

---

## Abstract

SPARK (Smart Personalized Activity Routes for Kids) is an interactive tool that helps parents and caregivers discover nearby child-friendly activities and generate personalized daily itineraries. By combining geographic data, developmental research, and route optimization, SPARK recommends activities that align with a child’s developmental stage while considering practical constraints such as distance and travel time. This report summarizes the project’s motivation, methodology, current progress, and evaluation plan.

---

## 1. Introduction

Parents and caregivers often face significant challenges balancing children's developmental needs with family schedules and geographic constraints. While existing software tools support general activity discovery or calendar management, they rarely integrate developmental guidance with practical, multi-stop planning. SPARK addresses this gap by combining geographic data from OpenStreetMap, age-specific developmental scoring, and route optimization to generate personalized activity itineraries tailored to a child's developmental priorities.

---

## 2. Problem Definition

Parenting involves substantial cognitive labor, including identifying meaningful activities, coordinating schedules, and considering long-term developmental goals [1, 2]. Existing tools largely address isolated aspects of this process—such as commercial business listings or basic calendar scheduling—rather than bringing these factors together into a coherent, developmentally informed plan. SPARK aims to bridge this gap by recommending nearby activities that collectively support a child's development while remaining convenient and manageable for caregivers.

---

## 3. Literature Survey

### Theme 1: Child Development and Caregiver Needs
Prior research shows that active play, sports, outdoor activities, and creative experiences contribute to children's cognitive, social-emotional, and physical development [3–9]. Studies also suggest that organized extracurricular participation supports long-term academic, behavioral, and social outcomes. These findings support SPARK's goal of generating balanced activity itineraries that encourage development across multiple domains while helping reduce parental planning stress.

### Theme 2: Recommendation Systems and Geographic Planning
Context-aware recommendation systems improve relevance by incorporating factors such as location, distance, and user preferences [10, 11]. OpenStreetMap provides an accessible and rich source of point-of-interest (POI) data [12, 13], while route optimization heuristics and map-based interfaces support effective daily itinerary planning and spatial decision-making [14–16].

---

## 4. Proposed Methods

### 4.1 Data Extraction and Preparation
POI data was extracted from OpenStreetMap and loaded into a local SQLite database using GeoPandas. Relevant child-friendly locations such as parks, playgrounds, museums, recreational facilities, and cultural venues were identified and converted into standardized latitude and longitude coordinates for candidate generation.

### 4.2 Data Integration and Candidate Generation
SPARK integrates four structured datasets:
1. **Local POIs:** Geographic coordinates, venue names, and categories.
2. **Category-to-Activity Mappings:** Associations between venue types and suitable child activities.
3. **Developmental Activity Scores:** Heuristic scores assessing activities across eight developmental dimensions.
4. **Age-Specific Priority Weights:** Developmental factor importance weights defined for children ages 2 through 12.

When a caregiver enters a starting address, it is geocoded into latitude and longitude coordinates. The Haversine formula is used to calculate distances between the starting location and nearby POIs. Locations within the user's selected radius are retained and joined with developmental activity data to generate candidate recommendations.

### 4.3 Age-Specific Developmental Scoring
Activities are evaluated across eight developmental dimensions derived from CDC and Harvard Center on the Developing Child guidance [17, 18]. Activity scores are normalized to a 0–1 scale and combined with age-specific developmental importance weights. This weighting allows SPARK to tailor recommendations to the developmental priorities of a child's specific age group rather than applying a static, one-size-fits-all ranking.

### 4.4 Multi-Objective Activity Selection
To generate balanced itineraries rather than simply selecting individual high-scoring activities, SPARK uses a diversity-aware optimization model:

$$J(S) = D(S) - \delta L(S) - \mu R(S)$$

Where:
* $D(S)$ represents developmental coverage across the eight domains (with diminishing returns for repeated domain exposure),
* $L(S)$ represents travel distance penalties relative to the starting location,
* $R(S)$ represents activity redundancy penalties based on pairwise similarity between activity profiles,
* $\delta$ and $\mu$ are adjustable weighting parameters controlling proximity and activity diversity.

A simulated annealing search algorithm is used to efficiently identify high-quality activity combinations while satisfying itinerary constraints (such as stop count limits and search radius boundaries).

### 4.5 Visualization and User Interaction
The SPARK web application provides a responsive two-panel dashboard built with Leaflet.js, D3.js, and a local Python/SQLite backend. Users enter their home address and select child age, travel radius, and desired number of stops. The left panel displays the recommended itinerary with a D3 timeline balancing travel and dwell times, venue details, and user feedback buttons. The right panel displays an interactive OpenStreetMap showing color-coded destination pins and the suggested travel route. Users can explore recommendations, provide feedback on activities, and refresh results dynamically when trip preferences change.

---

## 5. Innovations

SPARK introduces two primary innovations:

1. **Age-Weighted Developmental Scoring Framework:** SPARK operationalizes child-development literature into a quantitative scoring model. By combining multi-dimensional activity scores with age-specific developmental weights, the system dynamically tailors recommendations to a child's developmental stage.
2. **Development-Aware Route Optimization:** Unlike standard navigation tools that minimize only travel time or commercial platforms that rank venues by popularity, SPARK combines developmental scoring, geographic distance, and diversity penalties to produce balanced, practical multi-stop itineraries.

---

## 6. Evaluation Plan

We will evaluate SPARK using a user study of 10 participants (parents and caregivers of children aged 2–12), with each team member recruiting 2 participants. Users will generate activity itineraries based on realistic scenarios and evaluate recommendation quality, usability, practicality, map usefulness, and overall satisfaction using a 10-point scale (1 = Very Poor, 10 = Excellent). We will also measure itinerary generation time, track user acceptance rates of suggested stops, and compare the user experience against manual planning using standard map applications. In addition, we will benchmark solver execution time to ensure recommendations update smoothly during interactive filtering.

---

## 7. Plan of Activities

The table below summarizes our original timeline, updated schedule, and current milestone statuses.

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

## 8. References

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
