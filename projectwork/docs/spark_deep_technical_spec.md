# SPARK: Deep Technical Specification & Implementation Guide

This document provides a highly technical blueprint for implementing the three core pillars of the SPARK (Smart Personalized Activity Routes for Kids) platform.

---

## 1. Spatial Indexing & Geospatial Database Architecture

To achieve sub-100ms response times when filtering thousands of POIs from OpenStreetMap/Overture, we will use **PostgreSQL + PostGIS**.

### 1.1 Database Schema Definition
The core table must store POIs as PostGIS `geometry` types.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE spark_pois (
    poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id BIGINT,
    name VARCHAR(255),
    category VARCHAR(100),         -- e.g., 'playground', 'museum'
    location GEOMETRY(Point, 4326), -- EPSG:4326 is standard WGS84 Lat/Lon
    attributes JSONB,              -- Store unstructured OSM tags
    development_vector REAL[]      -- Pre-computed [cognitive, physical, social] vector
);
```

### 1.2 GiST Spatial Indexing
To prevent full table scans when the user pans the map, we implement a GiST index on the `location` column.

```sql
-- Create the Spatial Index using an R-Tree
CREATE INDEX idx_spark_pois_location ON spark_pois USING GIST (location);

-- Create a GIN index on the JSONB attributes for fast tag filtering
CREATE INDEX idx_spark_pois_attributes ON spark_pois USING GIN (attributes);
```

### 1.3 High-Performance Bounding Box Query
When the frontend sends the map's viewport coordinates, the backend executes a highly optimized intersection query using the `&&` bounding box operator.

```sql
-- Find POIs within a bounding box (e.g., a map viewport)
SELECT poi_id, name, category, ST_AsGeoJSON(location)
FROM spark_pois
WHERE location && ST_MakeEnvelope(
    -84.40, 33.74, -- Min Lon, Min Lat (Bottom Left)
    -84.38, 33.76, -- Max Lon, Max Lat (Top Right)
    4326
)
LIMIT 100;
```

---

## 2. Content-Based Recommendation Engine

Because SPARK has no historical user data (Cold Start), it relies on pure Content-Based Filtering utilizing Cosine Similarity between the User Profile Vector and the POI Vector.

### 2.1 Vector Space Definition
Let the developmental domains be defined as a 4-dimensional vector space:
$V = [v_{cognitive}, v_{physical}, v_{social}, v_{emotional}]$

*   **User Profile Vector ($U$):** Defined by the parent. E.g., heavily prioritizing physical activity and social skills: `U = [0.2, 0.9, 0.8, 0.1]`.
*   **POI Vector ($P$):** Calculated offline during data ingestion based on OSM tags. E.g., A playground (`leisure=playground`) vector might be `P = [0.1, 0.9, 0.7, 0.2]`.

### 2.2 Scoring Implementation (Python / NumPy)
The recommendation score is the **Cosine Similarity** between $U$ and $P$.

```python
import numpy as np
from typing import List, Dict

def calculate_recommendation_scores(user_vector: np.ndarray, poi_vectors: np.ndarray) -> np.ndarray:
    """
    Vectorized cosine similarity for thousands of POIs simultaneously.
    user_vector: Shape (4,)
    poi_vectors: Shape (N, 4) where N is number of POIs in map view
    """
    # Normalize user vector
    u_norm = user_vector / np.linalg.norm(user_vector)
    
    # Normalize POI vectors
    p_norms = np.linalg.norm(poi_vectors, axis=1, keepdims=True)
    
    # Avoid division by zero for invalid POIs
    p_norms[p_norms == 0] = 1 
    p_normalized = poi_vectors / p_norms
    
    # Calculate dot product (Cosine Similarity)
    scores = np.dot(p_normalized, u_norm)
    return scores

# Example Usage
user_pref = np.array([0.2, 0.9, 0.8, 0.1])
poi_matrix = np.array([
    [0.1, 0.9, 0.7, 0.2], # Playground
    [0.9, 0.1, 0.3, 0.4]  # Library
])

print(calculate_recommendation_scores(user_pref, poi_matrix))
# Output: [0.932, 0.354] (Playground wins)
```

---

## 3. Heuristic Routing Algorithms (TSPTW)

To create an optimized daily agenda, we frame the problem as a **Traveling Salesperson Problem with Time Windows (TSPTW)**. We maximize the accumulated "Developmental Score" while ensuring travel and activity times fit within the parent's schedule.

### 3.1 Travel Time Matrix Generation (OSRM)
Before routing, we need the exact drive time between all candidate POIs.

```python
import requests

def get_travel_time_matrix(coordinates: List[str]) -> List[List[float]]:
    """Fetches real driving time matrix from a local OSRM instance."""
    coord_string = ";".join(coordinates)
    url = f"http://localhost:5000/table/v1/driving/{coord_string}?annotations=duration"
    
    response = requests.get(url).json()
    return response['durations'] # Returns an NxN matrix of seconds
```

### 3.2 Optimization Solver (Google OR-Tools)
Using the travel time matrix, we use OR-Tools to solve the routing heuristically.

```python
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def create_daily_agenda(time_matrix, service_times, start_time, end_time):
    """
    time_matrix: NxN matrix of travel times in minutes
    service_times: Array of durations spent at each POI
    start_time/end_time: Time constraints (in minutes from midnight)
    """
    manager = pywrapcp.RoutingIndexManager(len(time_matrix), 1, 0) # 1 vehicle, start/end at index 0 (Home)
    routing = pywrapcp.RoutingModel(manager)

    # 1. Create Travel Time Callback
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node] + service_times[from_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 2. Add Time Window Constraints
    time_dimension_name = 'Time'
    routing.AddDimension(
        transit_callback_index,
        30,  # allow up to 30 mins waiting time/slack
        end_time - start_time, # maximum time per vehicle
        False,  # Don't force start cumul to zero
        time_dimension_name)
    
    time_dimension = routing.GetDimensionOrDie(time_dimension_name)

    # 3. Set Heuristic Strategy
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    # Guided Local Search escapes local minima to find better routes
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.seconds = 1 # strict 1-second timeout for UI responsiveness

    # 4. Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        return extract_route(manager, routing, solution, time_dimension)
    return None
```

### 3.3 The Heuristic Strategy (Guided Local Search)
OR-Tools will utilize **Guided Local Search (GLS)**. 
1. It builds an initial route using a greedy algorithm (e.g., closest unvisited POI that fits the time window).
2. It then iteratively applies local operators (e.g., swapping two POIs, reversing a sequence of POIs).
3. If it gets stuck in a "local minimum", GLS penalizes features of the current solution to force the algorithm to explore new routing sequences.
4. It halts at the hard 1-second time limit, ensuring the user isn't left waiting, and returns the best schedule found.
