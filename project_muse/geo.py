"""Travel-time estimation for SPARK (simplified spec, Section 6.1).

No external routing service. Haversine distance, adjusted by a
circuity factor for streets, at a downtown speed, plus a buffer.
These are estimates: say so on the page and in the report.
"""

import math

EARTH_RADIUS_MILES = 3958.8

# Downtown Los Angeles bounding box used everywhere for validation.
DTLA_BBOX = {
    "min_lat": 33.95,
    "max_lat": 34.15,
    "min_lon": -118.35,
    "max_lon": -118.15,
}


def haversine_miles(a, b):
    """Straight-line distance in miles between (lat, lon) points."""
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(h))


def travel_mins(a, b, speed_mph=22.0, circuity=1.35, buffer_mins=2.0):
    """Estimated travel minutes between two (lat, lon) points.

    The same point returns the buffer only when called directly;
    :func:`travel_matrix` sets the diagonal to 0 instead, because
    staying at a place costs no travel time.
    """
    road_miles = haversine_miles(a, b) * circuity
    return road_miles / float(speed_mph) * 60.0 + float(buffer_mins)


def travel_matrix(points, **kwargs):
    """Symmetric NxN matrix of travel minutes; diagonal is 0."""
    n = len(points)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            mins = travel_mins(points[i], points[j], **kwargs)
            matrix[i][j] = mins
            matrix[j][i] = mins
    return matrix


def is_inside_dtla(latitude, longitude):
    """True if a point is inside the Downtown LA box."""
    return (
        DTLA_BBOX["min_lat"] <= latitude <= DTLA_BBOX["max_lat"]
        and DTLA_BBOX["min_lon"] <= longitude <= DTLA_BBOX["max_lon"]
    )


def looks_swapped(latitude, longitude):
    """True if lat/lon look swapped (the OSM pitfall from the deep spec).

    In Los Angeles latitude is ~34 and longitude is ~-118. A row
    with latitude ~-118 and longitude ~34 has the pair swapped.
    Callers must reject such rows, not silently fix them.
    """
    return (
        DTLA_BBOX["min_lon"] <= latitude <= DTLA_BBOX["max_lon"]
        and DTLA_BBOX["min_lat"] <= longitude <= DTLA_BBOX["max_lat"]
    )
