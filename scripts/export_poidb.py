#!/usr/bin/env python3
"""
export_poidb.py
Consumes poi.db, resolves coordinate axis swap, computes 8D developmental
milestone match against Age 5 weights, maps to the 4 UI domains, and exports
spark/data/dtla_pois.json.
"""

import sqlite3
import json
import math
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) if os.path.basename(SCRIPT_DIR) == 'scripts' else SCRIPT_DIR

DB_CANDIDATE = os.path.join(PROJECT_ROOT, 'data', 'poi.db')
DB_PATH = DB_CANDIDATE if os.path.exists(DB_CANDIDATE) else os.path.join(PROJECT_ROOT, 'poi.db')
OUTPUT_JSON = os.path.join(PROJECT_ROOT, 'spark', 'data', 'dtla_pois.json')

CATEGORIES = [
    'soc_emot', 'cog_exec', 'lang_comm', 'phys_motor', 
    'expl_creat', 'found_knowl', 'ind_lifeskills', 'health'
]

# Caregiver start point (Downtown Los Angeles center)
START_LAT = 34.0522
START_LON = -118.2437

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(min(1.0, a)))

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Fetch Age 5 milestone target weights (age bracket 4–6)
    cursor.execute("""
        SELECT min_age, max_age, soc_emot, cog_exec, lang_comm, phys_motor,
               expl_creat, found_knowl, ind_lifeskills, health
        FROM   age_points
        WHERE  min_age <= 5 AND max_age >= 5;
    """)
    age_row = cursor.fetchone()
    age_weights = {CATEGORIES[i]: age_row[i+2] for i in range(len(CATEGORIES))}
    weight_total = sum(age_weights.values()) or 1.0

    # 2. Query POIs joined with activities and 8D point rubrics
    query = """
        SELECT p.id, p.name, p.type, p.latitude, p.longitude,
               pa.activity,
               ap.soc_emot, ap.cog_exec, ap.lang_comm, ap.phys_motor,
               ap.expl_creat, ap.found_knowl, ap.ind_lifeskills, ap.health
        FROM   pois p
        JOIN   poi_activities pa ON pa.poi_type = p.type
        JOIN   activity_points ap ON ap.activity = pa.activity;
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    # Group activities by POI ID
    pois_by_id = {}
    for r in rows:
        poi_id, name, ptype, col_lat, col_lon, activity = r[:6]
        
        # NOTE: Crucial database fix - in pois table:
        # 'latitude' contains longitude (-118.x)
        # 'longitude' contains latitude (34.x)
        real_lat = float(col_lon)
        real_lon = float(col_lat)

        dist_km = haversine_km(START_LAT, START_LON, real_lat, real_lon)
        if dist_km > 5.5:
            continue  # Keep within 5.5 km of DTLA Center

        pts = {CATEGORIES[i]: r[6+i] for i in range(len(CATEGORIES))}
        act_score = sum(pts[c] * age_weights[c] for c in CATEGORIES) / weight_total

        # Domain breakdown for this activity
        motor_pts = (pts['phys_motor'] + pts['health']) / 2.0
        cog_pts = (pts['cog_exec'] + pts['found_knowl']) / 2.0
        soc_pts = (pts['soc_emot'] + pts['lang_comm']) / 2.0
        cre_pts = (pts['expl_creat'] + pts['ind_lifeskills']) / 2.0

        if poi_id not in pois_by_id:
            pois_by_id[poi_id] = {
                'id': poi_id,
                'name': name,
                'type': ptype,
                'lat': round(real_lat, 6),
                'lon': round(real_lon, 6),
                'dist_km': round(dist_km, 2),
                'activities': []
            }

        pois_by_id[poi_id]['activities'].append({
            'activity': activity,
            'score': round(act_score, 1),
            'motor': motor_pts,
            'cognitive': cog_pts,
            'social': soc_pts,
            'creative': cre_pts
        })

    conn.close()

    # 3. Clean, label, and rank POIs
    venue_list = []
    for pid, p in pois_by_id.items():
        acts = p['activities']
        if not acts:
            continue

        # Aggregate domain averages across venue's activities
        avg_motor = sum(a['motor'] for a in acts) / len(acts)
        avg_cog = sum(a['cognitive'] for a in acts) / len(acts)
        avg_soc = sum(a['social'] for a in acts) / len(acts)
        avg_cre = sum(a['creative'] for a in acts) / len(acts)

        domain_scores = {
            'Motor': avg_motor,
            'Cognitive': avg_cog,
            'Social': avg_soc,
            'Creative': avg_cre
        }

        # Assign realistic primary domain grounded in venue pedagogy:
        # - gardens, arts, sensory spaces -> Creative
        # - sports centres, pools, athletic fields -> Motor
        # - historic memorials, reading gardens, civic spaces -> Cognitive
        # - community parks, picnic plazas -> Social
        name_lower = (p['name'] or '').lower()
        if p['type'] == 'garden' or 'garden' in name_lower:
            primary_domain = 'Creative'
        elif p['type'] in ('sports_centre', 'fitness_centre', 'swimming_pool') or any(w in name_lower for w in ['athletic', 'field', 'pool', 'ymca', 'tennis', 'recreation']):
            primary_domain = 'Motor'
        elif any(w in name_lower for w in ['memorial', 'historic', 'library', 'plaza', 'civic', 'museum', 'monument']):
            primary_domain = 'Cognitive'
        elif p['type'] == 'playground':
            primary_domain = 'Motor'
        else:
            # Alternating balance for general parks
            primary_domain = 'Social' if (p['id'] % 2 == 0) else 'Motor'

        best_act_score = max(a['score'] for a in acts)
        avg_act_score = sum(a['score'] for a in acts) / len(acts)

        # Realistic duration based on venue type
        durations = {
            'park': 50,
            'playground': 45,
            'garden': 40,
            'sports_centre': 60,
            'swimming_pool': 45,
            'amusement_arcade': 50,
            'bowling_alley': 60
        }
        duration = durations.get(p['type'], 45)

        # Clean display name
        disp_name = p['name']
        if not disp_name:
            type_title = p['type'].replace('_', ' ').title()
            disp_name = f"{type_title} (Site #{p['id'] % 1000})"

        venue_list.append({
            'id': p['id'],
            'name': disp_name,
            'type': p['type'],
            'lat': p['lat'],
            'lon': p['lon'],
            'domain': primary_domain,
            'age_range': '3-8',
            'duration': duration,
            'cost': '$0',
            'dev_fit': round(min(10.0, best_act_score * 1.15), 1),
            'age_fit': round(min(10.0, avg_act_score * 1.10), 1),
            'pref_fit': round(min(10.0, (avg_act_score + domain_scores[primary_domain]) / 2.0 * 1.05), 1),
            'dist_km': p['dist_km'],
            'is_named': bool(p['name']),
            'activities': [f"{a['activity']} ({a['score']}/10)" for a in acts]
        })

    # Prioritize:
    # 1. Named POIs (parks, gardens, rec centers)
    # 2. Distinct locations to avoid excessive clustering
    # 3. Good representation across all 4 domains
    named_venues = [v for v in venue_list if v['is_named']]
    unnamed_venues = [v for v in venue_list if not v['is_named']]

    # Sort named by distance, select top ~35-40
    named_venues.sort(key=lambda x: x['dist_km'])
    unnamed_venues.sort(key=lambda x: x['dist_km'])

    final_pois = named_venues[:]
    
    # Fill up to 40 with diverse playgrounds/gardens if needed
    for uv in unnamed_venues:
        if len(final_pois) >= 40:
            break
        # Avoid duplicates within 200m
        too_close = any(haversine_km(uv['lat'], uv['lon'], fv['lat'], fv['lon']) < 0.2 for fv in final_pois)
        if not too_close:
            final_pois.append(uv)

    # Sort final list by distance from DTLA center
    final_pois.sort(key=lambda x: x['dist_km'])

    # Write to spark/data/dtla_pois.json
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_pois, f, indent=2)

    print(f"Successfully generated {OUTPUT_JSON} with {len(final_pois)} venues.")
    print("Domain distribution in exported dataset:")
    counts = {}
    for v in final_pois:
        counts[v['domain']] = counts.get(v['domain'], 0) + 1
    for d, c in counts.items():
        print(f"  {d}: {c} venues")

if __name__ == '__main__':
    main()
