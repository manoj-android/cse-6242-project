// ── SPARK: Smart Personalized Activity Routes for Kids ──
// Downtown Los Angeles Interactive Visual Analytics
// CSE 6242 · Team 61 · Georgia Tech

// ── 1. Configuration & Start Point ──────────────────────────────────────────
let CAREGIVER_START = {
    name: 'Pershing Square (DTLA)',
    lat: 34.0488,
    lon: -118.2518 // 7th & Grand / Pershing Square area
};

let homeMarker = null;

const DOMAINS = ['Motor', 'Cognitive', 'Social', 'Creative'];
const DOMAIN_COLORS = {
    Motor: '#38bdf8',      // Cyan
    Cognitive: '#a78bfa',  // Violet
    Social: '#34d399',     // Emerald
    Creative: '#fbbf24'    // Amber
};

// Child age 5 target needs baseline across domains (out of 10)
const CHILD_TARGET_NEEDS = {
    Motor: 8.5,
    Cognitive: 7.0,
    Social: 8.0,
    Creative: 7.5
};

// ── 2. Downtown Los Angeles POI Dataset (35 Real Venues) ────────────────────
let POIS = [
    {
        "id": 206420459,
        "name": "Biddy Mason Memorial Park",
        "type": "park",
        "lat": 34.049887,
        "lon": -118.248466,
        "domain": "Cognitive",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.51,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 39563249,
        "name": "Angels Knoll Park",
        "type": "park",
        "lat": 34.05106,
        "lon": -118.250558,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 0.64,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 356677928,
        "name": "Spring Street Park",
        "type": "park",
        "lat": 34.047916,
        "lon": -118.248657,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 0.66,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 469789460,
        "name": "California Plaza Park",
        "type": "park",
        "lat": 34.052447,
        "lon": -118.251014,
        "domain": "Cognitive",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.67,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 1074073098,
        "name": "Fredric Roberts Garden",
        "type": "garden",
        "lat": 34.056864,
        "lon": -118.248237,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.67,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 319307755,
        "name": "Blue Ribbon Garden",
        "type": "garden",
        "lat": 34.055574,
        "lon": -118.250265,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.71,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 319143487,
        "name": "California Friendly\u00ae Demonstration Garden",
        "type": "garden",
        "lat": 34.057547,
        "lon": -118.249228,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.78,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 319143488,
        "name": "California Friendly\u00ae Demonstration Garden",
        "type": "garden",
        "lat": 34.057938,
        "lon": -118.248862,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 0.8,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 80579943,
        "name": "Pershing Square",
        "type": "park",
        "lat": 34.048396,
        "lon": -118.253022,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 0.96,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 428021871,
        "name": "Pershing Square",
        "type": "sports_centre",
        "lat": 34.04858,
        "lon": -118.253275,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 60,
        "cost": "$0",
        "dev_fit": 8.7,
        "age_fit": 8.4,
        "pref_fit": 8.7,
        "dist_km": 0.97,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 427532196,
        "name": "Stuart M Ketchum Downtown YMCA",
        "type": "sports_centre",
        "lat": 34.052136,
        "lon": -118.254657,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 60,
        "cost": "$0",
        "dev_fit": 8.7,
        "age_fit": 8.4,
        "pref_fit": 8.7,
        "dist_km": 1.01,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 206464423,
        "name": "Maguire Gardens",
        "type": "park",
        "lat": 34.050966,
        "lon": -118.256101,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 1.15,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 1022381979,
        "name": "Canvas LA Pool",
        "type": "swimming_pool",
        "lat": 34.059726,
        "lon": -118.25326,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 45,
        "cost": "$0",
        "dev_fit": 7.5,
        "age_fit": 7.2,
        "pref_fit": 7.6,
        "dist_km": 1.21,
        "is_named": true,
        "activities": [
            "swimming (6.5/10)"
        ]
    },
    {
        "id": 428021730,
        "name": "Jonathan Club",
        "type": "fitness_centre",
        "lat": 34.051551,
        "lon": -118.258527,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 45,
        "cost": "$0",
        "dev_fit": 8.7,
        "age_fit": 8.4,
        "pref_fit": 8.7,
        "dist_km": 1.37,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173105829,
        "name": "Vista Hermosa Park",
        "type": "park",
        "lat": 34.061971,
        "lon": -118.256887,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 1.63,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 442694854,
        "name": "Grand Hope Park",
        "type": "park",
        "lat": 34.044114,
        "lon": -118.260761,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 1.81,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 60515918,
        "name": "Marion Park",
        "type": "park",
        "lat": 34.067778,
        "lon": -118.251824,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 1.89,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 426247802,
        "name": "Echo Park Deep Pool",
        "type": "sports_centre",
        "lat": 34.06467,
        "lon": -118.259128,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 60,
        "cost": "$0",
        "dev_fit": 8.7,
        "age_fit": 8.4,
        "pref_fit": 8.7,
        "dist_km": 1.99,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173008307,
        "name": "Everett Park",
        "type": "park",
        "lat": 34.069862,
        "lon": -118.248787,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 2.02,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173105003,
        "name": "Rockwood Park",
        "type": "park",
        "lat": 34.064119,
        "lon": -118.261912,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 2.14,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 244066785,
        "name": "Unidad Park",
        "type": "park",
        "lat": 34.063769,
        "lon": -118.26469,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 2.32,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173105002,
        "name": "Echo Park",
        "type": "park",
        "lat": 34.068477,
        "lon": -118.260101,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 2.36,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 428021739,
        "name": "Crypto.com Arena",
        "type": "stadium",
        "lat": 34.042998,
        "lon": -118.267135,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 45,
        "cost": "$0",
        "dev_fit": 8.7,
        "age_fit": 8.1,
        "pref_fit": 8.4,
        "dist_km": 2.39,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "play tag (6.8/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 145652680,
        "name": "Victory Memorial Grove",
        "type": "park",
        "lat": 34.073787,
        "lon": -118.249561,
        "domain": "Cognitive",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 2.46,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173105004,
        "name": "Echo Park Recreation Center",
        "type": "park",
        "lat": 34.069909,
        "lon": -118.260508,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 2.5,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 161705352,
        "name": "Echo Park",
        "type": "park",
        "lat": 34.073027,
        "lon": -118.260716,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 2.8,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 244106568,
        "name": "Hope and Peace Park",
        "type": "park",
        "lat": 34.052789,
        "lon": -118.276672,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 3.04,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 986038079,
        "name": "Lake Street Park",
        "type": "park",
        "lat": 34.069013,
        "lon": -118.270728,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 3.11,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 160998254,
        "name": "MacArthur Park",
        "type": "park",
        "lat": 34.058842,
        "lon": -118.277696,
        "domain": "Social",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.3,
        "dist_km": 3.22,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 244106621,
        "name": "Terrace Park",
        "type": "park",
        "lat": 34.044931,
        "lon": -118.281124,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 3.54,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 161508108,
        "name": "Lafayette Recreation Center",
        "type": "park",
        "lat": 34.06204,
        "lon": -118.284223,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 3.89,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 427290102,
        "name": "Francis Avenue Community Garden",
        "type": "garden",
        "lat": 34.057062,
        "lon": -118.289455,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 4.25,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 173104263,
        "name": "Laurel and Hardy Park",
        "type": "park",
        "lat": 34.082686,
        "lon": -118.274985,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 4.45,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 205589651,
        "name": "Tommy Lasorda Field of Dreams",
        "type": "park",
        "lat": 34.090885,
        "lon": -118.25953,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 4.54,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 201874470,
        "name": "Shatto Recreation Center",
        "type": "park",
        "lat": 34.067633,
        "lon": -118.289551,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 4.56,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 426245067,
        "name": "Shatto 39 Lanes",
        "type": "bowling_alley",
        "lat": 34.067392,
        "lon": -118.291004,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 60,
        "cost": "$0",
        "dev_fit": 8.2,
        "age_fit": 7.2,
        "pref_fit": 6.8,
        "dist_km": 4.67,
        "is_named": true,
        "activities": [
            "arcade_games (5.9/10)",
            "bowling (7.1/10)"
        ]
    },
    {
        "id": 174264681,
        "name": "Bimini Slough Ecology Park",
        "type": "park",
        "lat": 34.0704,
        "lon": -118.29019,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 4.74,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 898624139,
        "name": "Micheltorena Community Garden",
        "type": "garden",
        "lat": 34.08793,
        "lon": -118.275793,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 4.95,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 240887684,
        "name": "Silver Lake Recreation Center",
        "type": "park",
        "lat": 34.092624,
        "lon": -118.266482,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 4.96,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 201733907,
        "name": "Bellevue Recreation Center",
        "type": "park",
        "lat": 34.08533,
        "lon": -118.281344,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 5.06,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 1176846935,
        "name": "Robert F. Kennedy Inspiration Park",
        "type": "park",
        "lat": 34.061556,
        "lon": -118.297485,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 5.06,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 244066879,
        "name": "Madison West Park",
        "type": "park",
        "lat": 34.079539,
        "lon": -118.288357,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 5.11,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 449591337,
        "name": "Mariposa-Nabi Community Garden",
        "type": "garden",
        "lat": 34.053718,
        "lon": -118.299262,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 5.12,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 449593793,
        "name": "Yamazaki Memorial Community Garden",
        "type": "garden",
        "lat": 34.054348,
        "lon": -118.299738,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 5.17,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 738070851,
        "name": "Koreatown Pavilion Garden",
        "type": "park",
        "lat": 34.053093,
        "lon": -118.299991,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 5.19,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 136750749,
        "name": "Normandie Park",
        "type": "park",
        "lat": 34.04483,
        "lon": -118.299689,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 5.22,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 211811473,
        "name": "xeriscape garden",
        "type": "garden",
        "lat": 34.076615,
        "lon": -118.292333,
        "domain": "Creative",
        "age_range": "3-8",
        "duration": 40,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 7.7,
        "dist_km": 5.24,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    },
    {
        "id": 76659637,
        "name": "Seoul International Park",
        "type": "park",
        "lat": 34.053563,
        "lon": -118.301093,
        "domain": "Motor",
        "age_range": "3-8",
        "duration": 50,
        "cost": "$0",
        "dev_fit": 8.9,
        "age_fit": 8.4,
        "pref_fit": 8.2,
        "dist_km": 5.29,
        "is_named": true,
        "activities": [
            "ballgames (7.6/10)",
            "hide-and-seek (7.7/10)",
            "picknick (7.7/10)",
            "soccer (7.6/10)",
            "softball (7.6/10)"
        ]
    }
];

// ── 3. Distance & Scoring Math ──────────────────────────────────────────────
// Straight-line Haversine formula in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Estimate urban transit minutes from straight-line miles (limitation noted in UI)
function estimateTravelMins(distMiles) {
    // 3.5 mins per straight-line mile + 2 mins parking/turn penalty
    return Math.max(3, Math.round(distMiles * 3.5 + 2));
}

// Compute fit components and final score for a POI from current location
function computePoiScore(poi, curLat, curLon) {
    const dist = haversineMiles(curLat, curLon, poi.lat, poi.lon);
    const travelMins = estimateTravelMins(dist);

    // Formula: 0.6 * dev_fit + 0.25 * age_fit + 0.15 * pref_fit - travel_penalty
    const devPart = 0.60 * poi.dev_fit;
    const agePart = 0.25 * poi.age_fit;
    const prefPart = 0.15 * poi.pref_fit;
    const penalty = +(travelMins * 0.12).toFixed(2); // penalty per travel minute
    const finalScore = +(devPart + agePart + prefPart - penalty).toFixed(2);

    return {
        distMiles: +dist.toFixed(2),
        travelMins,
        devPart: +devPart.toFixed(2),
        agePart: +agePart.toFixed(2),
        prefPart: +prefPart.toFixed(2),
        penalty,
        finalScore: Math.max(0.1, finalScore)
    };
}

// ── 4. Routing Algorithms ───────────────────────────────────────────────────

// A. Greedy SPARK Routing Algorithm (One-sentence rule):
// "Pick the highest-scoring POI within the time budget, then the best next POI nearby, stop when budget is used."
function generateSparkRoute(domainFilter, maxBudgetMins) {
    let pool = POIS.filter(p => domainFilter === 'all' || p.domain === domainFilter);
    let route = [];
    let curLat = CAREGIVER_START.lat;
    let curLon = CAREGIVER_START.lon;
    let timeSpent = 0;

    let unvisited = [...pool];

    while (unvisited.length > 0) {
        // Score all unvisited POIs from current location
        let candidates = unvisited.map(p => {
            const scoreObj = computePoiScore(p, curLat, curLon);
            const returnDist = haversineMiles(p.lat, p.lon, CAREGIVER_START.lat, CAREGIVER_START.lon);
            const returnTravelMins = estimateTravelMins(returnDist);
            const additionalTime = scoreObj.travelMins + p.duration + returnTravelMins;
            return {
                poi: p,
                scoreObj,
                returnTravelMins,
                additionalTime
            };
        });

        // Keep candidates where (current total + leg travel + duration + return home) <= budget
        let viable = candidates.filter(c => (timeSpent + c.additionalTime) <= maxBudgetMins);

        if (viable.length === 0) break; // No more stops fit in budget

        // Pick the candidate with the highest final score
        viable.sort((a, b) => b.scoreObj.finalScore - a.scoreObj.finalScore);
        const best = viable[0];

        route.push({
            poi: best.poi,
            scoreObj: best.scoreObj,
            travelMins: best.scoreObj.travelMins
        });

        timeSpent += best.scoreObj.travelMins + best.poi.duration;
        curLat = best.poi.lat;
        curLon = best.poi.lon;
        unvisited = unvisited.filter(p => p.id !== best.poi.id);
    }

    // Add return leg to home
    let returnMins = 0;
    if (route.length > 0) {
        const lastPoi = route[route.length - 1].poi;
        returnMins = estimateTravelMins(haversineMiles(lastPoi.lat, lastPoi.lon, CAREGIVER_START.lat, CAREGIVER_START.lon));
        timeSpent += returnMins;
    }

    return {
        stops: route,
        returnMins,
        totalTime: timeSpent
    };
}

// B. Nearest-Neighbor Baseline Route (Comparison Benchmark)
// "Picks the closest POIs nearby regardless of developmental score until budget is used."
function generateBaselineRoute(domainFilter, maxBudgetMins) {
    let pool = POIS.filter(p => domainFilter === 'all' || p.domain === domainFilter);
    let route = [];
    let curLat = CAREGIVER_START.lat;
    let curLon = CAREGIVER_START.lon;
    let timeSpent = 0;

    let unvisited = [...pool];

    while (unvisited.length > 0) {
        let candidates = unvisited.map(p => {
            const dist = haversineMiles(curLat, curLon, p.lat, p.lon);
            const travelMins = estimateTravelMins(dist);
            const returnDist = haversineMiles(p.lat, p.lon, CAREGIVER_START.lat, CAREGIVER_START.lon);
            const returnTravelMins = estimateTravelMins(returnDist);
            const additionalTime = travelMins + p.duration + returnTravelMins;
            const scoreObj = computePoiScore(p, curLat, curLon);
            return {
                poi: p,
                dist,
                travelMins,
                scoreObj,
                additionalTime
            };
        });

        let viable = candidates.filter(c => (timeSpent + c.additionalTime) <= maxBudgetMins);
        if (viable.length === 0) break;

        // Pick purely by minimum distance
        viable.sort((a, b) => a.dist - b.dist);
        const closest = viable[0];

        route.push({
            poi: closest.poi,
            scoreObj: closest.scoreObj,
            travelMins: closest.travelMins
        });

        timeSpent += closest.travelMins + closest.poi.duration;
        curLat = closest.poi.lat;
        curLon = closest.poi.lon;
        unvisited = unvisited.filter(p => p.id !== closest.poi.id);
    }

    let returnMins = 0;
    if (route.length > 0) {
        const lastPoi = route[route.length - 1].poi;
        returnMins = estimateTravelMins(haversineMiles(lastPoi.lat, lastPoi.lon, CAREGIVER_START.lat, CAREGIVER_START.lon));
        timeSpent += returnMins;
    }

    return {
        stops: route,
        returnMins,
        totalTime: timeSpent
    };
}

// ── 5. App State & Model Evaluation Storage ────────────────────────────────
function loadEvaluations() {
    try {
        const stored = localStorage.getItem('spark_model_evaluations');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

function saveEvaluations() {
    try {
        localStorage.setItem('spark_model_evaluations', JSON.stringify(state.evaluations));
    } catch (e) {}
}

let state = {
    domainFilter: 'all',
    maxBudgetMins: 150,
    selectedPoiId: null,
    sparkRoute: null,
    baseRoute: null,
    evaluations: loadEvaluations()
};

function getEvaluationStats() {
    let totalVotes = 0;
    let upvotes = 0;
    let downvotes = 0;
    
    Object.values(state.evaluations).forEach(item => {
        if (item.poiVote === 1) { totalVotes++; upvotes++; }
        else if (item.poiVote === -1) { totalVotes++; downvotes++; }
        
        if (item.activities) {
            Object.values(item.activities).forEach(v => {
                if (v === 1) { totalVotes++; upvotes++; }
                else if (v === -1) { totalVotes++; downvotes++; }
            });
        }
    });

    const pct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
    return { totalVotes, upvotes, downvotes, pct };
}

function updateEvaluationUI() {
    const label = document.getElementById('eval-stats-label');
    if (!label) return;
    const stats = getEvaluationStats();
    if (stats.totalVotes === 0) {
        label.innerHTML = `Model Eval: <strong>0 votes</strong>`;
    } else {
        label.innerHTML = `Model Eval: <strong>${stats.totalVotes} votes</strong> (${stats.pct}% pos)`;
    }
}

function exportEvaluationData() {
    const stats = getEvaluationStats();
    const rows = [];
    
    POIS.forEach(p => {
        const evalData = state.evaluations[p.id];
        if (!evalData) return;
        
        const venueRating = evalData.poiVote === 1 ? 'upvote' : (evalData.poiVote === -1 ? 'downvote' : 'none');
        const actEvals = [];
        if (evalData.activities) {
            Object.entries(evalData.activities).forEach(([act, v]) => {
                if (v !== 0) {
                    actEvals.push({ activity: act, vote: v === 1 ? 'upvote' : 'downvote' });
                }
            });
        }
        
        if (venueRating !== 'none' || actEvals.length > 0) {
            rows.push({
                poi_id: p.id,
                poi_name: p.name,
                domain: p.domain,
                composite_score: p.dev_fit,
                venue_evaluation: venueRating,
                activity_evaluations: actEvals
            });
        }
    });
    
    const exportPayload = {
        title: "SPARK Model Evaluation Feedback Dataset",
        exported_at: new Date().toISOString(),
        target_child_age: 5,
        summary: stats,
        data: rows
    };
    
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spark_model_evaluation_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.voteActivity = function(poiId, actName, voteType) {
    if (!state.evaluations[poiId]) {
        state.evaluations[poiId] = { poiVote: 0, activities: {} };
    }
    if (!state.evaluations[poiId].activities) {
        state.evaluations[poiId].activities = {};
    }
    const current = state.evaluations[poiId].activities[actName] || 0;
    state.evaluations[poiId].activities[actName] = (current === voteType) ? 0 : voteType;
    saveEvaluations();
    updateEvaluationUI();
    
    const targetPoi = POIS.find(p => p.id === poiId);
    if (targetPoi && poiMarkerMap[poiId] && poiMarkerMap[poiId].isPopupOpen()) {
        poiMarkerMap[poiId].setPopupContent(getPoiPopupHtml(targetPoi));
    }
};

window.votePoi = function(poiId, voteType) {
    if (!state.evaluations[poiId]) {
        state.evaluations[poiId] = { poiVote: 0, activities: {} };
    }
    const current = state.evaluations[poiId].poiVote || 0;
    state.evaluations[poiId].poiVote = (current === voteType) ? 0 : voteType;
    saveEvaluations();
    updateEvaluationUI();
    
    const targetPoi = POIS.find(p => p.id === poiId);
    if (targetPoi && poiMarkerMap[poiId] && poiMarkerMap[poiId].isPopupOpen()) {
        poiMarkerMap[poiId].setPopupContent(getPoiPopupHtml(targetPoi));
    }
};

function getPoiPopupHtml(p) {
    const scoreObj = computePoiScore(p, CAREGIVER_START.lat, CAREGIVER_START.lon);
    const poiEval = state.evaluations[p.id] || { poiVote: 0, activities: {} };
    const actVotes = poiEval.activities || {};

    let activitiesHtml = '';
    if (p.activities && p.activities.length > 0) {
        activitiesHtml = p.activities.map(item => {
            const parts = item.split('(');
            const rawName = parts[0].trim();
            const scorePart = parts[1] ? parts[1].replace(')', '').trim() : '';
            const vote = actVotes[rawName] || 0;
            const upActive = vote === 1 ? 'active' : '';
            const downActive = vote === -1 ? 'active' : '';
            const cleanActName = rawName.replace(/'/g, "\\'");
            
            return `
            <li class="popup-activity-item">
                <div class="act-left">
                    <span class="act-bullet">•</span>
                    <span class="act-name">${rawName}</span>
                </div>
                ${scorePart ? `<span class="act-score">${scorePart}</span>` : ''}
                <div class="act-vote-btns">
                    <button type="button" class="vote-btn up ${upActive}" 
                            onclick="event.stopPropagation(); window.voteActivity(${p.id}, '${cleanActName}', 1);" 
                            title="Upvote: High quality developmental activity">👍</button>
                    <button type="button" class="vote-btn down ${downActive}" 
                            onclick="event.stopPropagation(); window.voteActivity(${p.id}, '${cleanActName}', -1);" 
                            title="Downvote: Low relevance or poor age fit">👎</button>
                </div>
            </li>`;
        }).join('');
    } else {
        activitiesHtml = `<li class="popup-activity-item" style="color:#64748b;font-style:italic">No tagged activities</li>`;
    }

    const poiUpActive = poiEval.poiVote === 1 ? 'active' : '';
    const poiDownActive = poiEval.poiVote === -1 ? 'active' : '';

    return `
    <div class="poi-popup-card">
        <div class="poi-popup-header">
            <div class="poi-popup-title">${p.name}</div>
            <div class="poi-popup-meta">
                <span class="poi-badge badge-domain ${p.domain}">${p.domain}</span>
                <span class="poi-badge badge-duration">⏱ ${p.duration}m</span>
                <span class="poi-badge badge-score">★ ${scoreObj.finalScore}/10</span>
            </div>
        </div>
        
        <div class="poi-popup-section-title">
            <span>Recommended Activities</span>
            <span class="eval-hint">Rate fit:</span>
        </div>
        
        <ul class="popup-activity-list">
            ${activitiesHtml}
        </ul>

        <div class="poi-popup-footer">
            <span style="color:#94a3b8;font-weight:600">Venue Fit:</span>
            <div class="poi-vote-group">
                <button type="button" class="poi-vote-btn up ${poiUpActive}" 
                        onclick="event.stopPropagation(); window.votePoi(${p.id}, 1)" 
                        title="Upvote: Excellent venue recommendation">👍 Recommended</button>
                <button type="button" class="poi-vote-btn down ${poiDownActive}" 
                        onclick="event.stopPropagation(); window.votePoi(${p.id}, -1)" 
                        title="Downvote: Not suitable for family outing">👎 Not Fit</button>
            </div>
        </div>
    </div>`;
}

// ── 6. Leaflet Map Setup ────────────────────────────────────────────────────
let map, markersLayer, routeLayer;
let poiMarkerMap = {};

function initMap() {
    map = L.map('map', {
        center: [34.0505, -118.2520],
        zoom: 13,
        zoomControl: true
    });

    // Standard OpenStreetMap Street Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);

    // Add Caregiver Start Pin
    const startIcon = L.divIcon({
        className: 'home-marker-icon',
        html: '🏠',
        iconSize: [24, 24]
    });
    homeMarker = L.marker([CAREGIVER_START.lat, CAREGIVER_START.lon], { icon: startIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<strong>${CAREGIVER_START.name}</strong><br><span style="color:#64748b">Start & Return Point</span>`);
}

function updateMapDisplay() {
    markersLayer.clearLayers();
    routeLayer.clearLayers();

    const routeStops = state.sparkRoute.stops;
    const routePoiIds = new Set(routeStops.map(s => s.poi.id));

    poiMarkerMap = {};

    // 1. Draw all candidate POIs
    POIS.forEach(p => {
        const isSelectedDomain = (state.domainFilter === 'all' || p.domain === state.domainFilter);
        const inRoute = routePoiIds.has(p.id);
        const scoreObj = computePoiScore(p, CAREGIVER_START.lat, CAREGIVER_START.lon);

        const circle = L.circleMarker([p.lat, p.lon], {
            radius: Math.max(6, Math.min(13, scoreObj.finalScore * 1.3)),
            fillColor: DOMAIN_COLORS[p.domain] || '#0284c7',
            color: inRoute ? '#0f172a' : '#334155',
            weight: inRoute ? 3 : 1.5,
            opacity: 1,
            fillOpacity: isSelectedDomain ? (inRoute ? 0.95 : 0.7) : 0.15
        });

        circle.bindPopup(getPoiPopupHtml(p), {
            className: 'spark-poi-popup',
            maxWidth: 300,
            minWidth: 260,
            autoPan: true
        });

        circle.on('mouseover', function() {
            this.openPopup();
        });

        circle.on('click', () => {
            selectPoi(p.id);
            circle.openPopup();
        });

        poiMarkerMap[p.id] = circle;
        markersLayer.addLayer(circle);
    });

    // 2. Draw Numbered Icons & Polyline for SPARK Route
    if (routeStops.length > 0) {
        const latlngs = [
            [CAREGIVER_START.lat, CAREGIVER_START.lon],
            ...routeStops.map(s => [s.poi.lat, s.poi.lon]),
            [CAREGIVER_START.lat, CAREGIVER_START.lon]
        ];

        // Route Polyline
        const routeLine = L.polyline(latlngs, {
            color: '#0284c7',
            weight: 4,
            opacity: 0.9,
            dashArray: '7, 5'
        });
        routeLayer.addLayer(routeLine);

        // Numbered Stop Pins
        routeStops.forEach((stop, idx) => {
            const numIcon = L.divIcon({
                className: 'poi-num-icon',
                html: `${idx + 1}`,
                iconSize: [22, 22]
            });
            const marker = L.marker([stop.poi.lat, stop.poi.lon], { icon: numIcon, zIndexOffset: 500 });
            marker.bindPopup(getPoiPopupHtml(stop.poi), {
                className: 'spark-poi-popup',
                maxWidth: 300,
                minWidth: 260
            });
            marker.on('mouseover', function() { this.openPopup(); });
            marker.on('click', () => {
                selectPoi(stop.poi.id);
                marker.openPopup();
            });
            routeLayer.addLayer(marker);
        });
    }
}

// ── 7. Fit Panel: D3 Visualizations ─────────────────────────────────────────

// Chart A: D3 Radar Chart (Child Needs vs. Route Coverage)
function renderRadarChart() {
    const container = document.getElementById('radar-chart');
    container.innerHTML = '';

    const width = 240;
    const height = 180;
    const radius = Math.min(width, height) / 2 - 25;
    const center = { x: width / 2, y: height / 2 };

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Calculate Route coverage per domain
    const routeCoverage = { Motor: 0, Cognitive: 0, Social: 0, Creative: 0 };
    state.sparkRoute.stops.forEach(s => {
        routeCoverage[s.poi.domain] += s.scoreObj.finalScore;
    });
    // Scale coverage to 0-10 range for visual comparison
    DOMAINS.forEach(d => {
        routeCoverage[d] = Math.min(10, +(routeCoverage[d] * 0.9).toFixed(1));
    });

    const angleSlice = (Math.PI * 2) / DOMAINS.length;
    const rScale = d3.scaleLinear().domain([0, 10]).range([0, radius]);

    // Concentric grid circles
    const levels = [3.3, 6.6, 10];
    levels.forEach(lvl => {
        svg.append('circle')
            .attr('cx', center.x)
            .attr('cy', center.y)
            .attr('r', rScale(lvl))
            .attr('fill', 'none')
            .attr('stroke', '#232f45')
            .attr('stroke-dasharray', '2,2');
    });

    // Axis lines and labels
    DOMAINS.forEach((domain, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = center.x + rScale(10) * Math.cos(angle);
        const y = center.y + rScale(10) * Math.sin(angle);

        svg.append('line')
            .attr('x1', center.x)
            .attr('y1', center.y)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', '#232f45');

        const labelX = center.x + (radius + 15) * Math.cos(angle);
        const labelY = center.y + (radius + 15) * Math.sin(angle);

        svg.append('text')
            .attr('x', labelX)
            .attr('y', labelY)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', DOMAIN_COLORS[domain])
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .text(domain);
    });

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    // 1. Child Target Need Polygon
    const needPoints = DOMAINS.map(d => ({ value: CHILD_TARGET_NEEDS[d] }));
    svg.append('path')
        .datum(needPoints)
        .attr('d', radarLine)
        .attr('transform', `translate(${center.x}, ${center.y})`)
        .attr('fill', 'rgba(100, 116, 139, 0.25)')
        .attr('stroke', '#64748b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');

    // 2. Route Coverage Polygon
    const routePoints = DOMAINS.map(d => ({ value: routeCoverage[d] }));
    svg.append('path')
        .datum(routePoints)
        .attr('d', radarLine)
        .attr('transform', `translate(${center.x}, ${center.y})`)
        .attr('fill', 'rgba(52, 211, 153, 0.35)')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2);
}

// Chart B: D3 Stacked Bar for Selected POI
function renderStackedBar() {
    const container = document.getElementById('stacked-bar-chart');
    container.innerHTML = '';

    const poi = POIS.find(p => p.id === state.selectedPoiId) ||
                (state.sparkRoute.stops[0] ? state.sparkRoute.stops[0].poi : POIS[0]);

    if (!poi) return;

    document.getElementById('selected-poi-name').textContent = poi.name;

    const score = computePoiScore(poi, CAREGIVER_START.lat, CAREGIVER_START.lon);

    const width = 320;
    const height = 48;
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const maxVal = 10;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, width - 40]);

    let curX = 0;
    const segments = [
        { label: 'Dev Fit', val: score.devPart, color: '#38bdf8' },
        { label: 'Age Fit', val: score.agePart, color: '#a78bfa' },
        { label: 'Pref',    val: score.prefPart, color: '#34d399' }
    ];

    // Positive stacked segments
    segments.forEach(seg => {
        const segWidth = xScale(seg.val);
        svg.append('rect')
            .attr('x', curX)
            .attr('y', 10)
            .attr('width', Math.max(0, segWidth))
            .attr('height', 20)
            .attr('fill', seg.color)
            .attr('rx', curX === 0 ? 3 : 0);

        if (segWidth > 20) {
            svg.append('text')
                .attr('x', curX + segWidth / 2)
                .attr('y', 23)
                .attr('text-anchor', 'middle')
                .attr('fill', '#0f172a')
                .attr('font-size', '10px')
                .attr('font-weight', '700')
                .text(seg.val);
        }
        curX += segWidth;
    });

    // Penalty segment (deduction bar in red)
    const penWidth = xScale(score.penalty);
    svg.append('rect')
        .attr('x', Math.max(0, curX - penWidth))
        .attr('y', 6)
        .attr('width', penWidth)
        .attr('height', 28)
        .attr('fill', 'rgba(248, 113, 113, 0.4)')
        .attr('stroke', '#f87171')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '2,2')
        .attr('rx', 3);

    // Final score label
    svg.append('text')
        .attr('x', width - 5)
        .attr('y', 24)
        .attr('text-anchor', 'end')
        .attr('fill', '#fbbf24')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .text(`= ${score.finalScore}`);
}

// ── 8. Itinerary Summary & Baseline Evaluation ──────────────────────────────
function renderItineraryAndScorecard() {
    const timeline = document.getElementById('timeline-track');
    timeline.innerHTML = '';

    const spark = state.sparkRoute;
    const base = state.baseRoute;

    // A. Render Timeline
    // 1. Home Departure
    timeline.innerHTML += `
        <div class="timeline-block block-travel">
            <span class="block-title">🏠 Depart Home</span>
            <span class="block-sub">Caregiver Base</span>
        </div>
    `;

    spark.stops.forEach((stop, i) => {
        // Travel leg
        timeline.innerHTML += `
            <div class="timeline-block block-travel">
                <span class="block-title">🚗 ${stop.travelMins}m</span>
                <span class="block-sub">transit</span>
            </div>
        `;
        // POI stop
        const isActive = stop.poi.id === state.selectedPoiId ? 'active' : '';
        timeline.innerHTML += `
            <div class="timeline-block block-poi ${isActive}" onclick="selectPoi(${stop.poi.id})">
                <span class="block-title">Stop ${i + 1}: ${stop.poi.name}</span>
                <span class="block-sub">${stop.poi.domain} · ${stop.poi.duration} mins · Score ${stop.scoreObj.finalScore}</span>
            </div>
        `;
    });

    // Return leg
    if (spark.stops.length > 0) {
        timeline.innerHTML += `
            <div class="timeline-block block-travel">
                <span class="block-title">🚗 ${spark.returnMins}m</span>
                <span class="block-sub">return</span>
            </div>
            <div class="timeline-block block-travel">
                <span class="block-title">🏠 Home</span>
                <span class="block-sub">Total: ${spark.totalTime}m</span>
            </div>
        `;
    }

    // B. Calculate Metrics for SPARK
    const sparkTravelTime = spark.stops.reduce((acc, s) => acc + s.travelMins, 0) + spark.returnMins;
    const sparkDomains = new Set(spark.stops.map(s => s.poi.domain)).size;
    const sparkTotalScore = +spark.stops.reduce((acc, s) => acc + s.scoreObj.finalScore, 0).toFixed(1);

    document.getElementById('spark-total-time').textContent = `${spark.totalTime}m`;
    document.getElementById('spark-travel-time').textContent = `${sparkTravelTime}m`;
    document.getElementById('spark-domains').textContent = `${sparkDomains} / 4`;
    document.getElementById('spark-total-score').textContent = sparkTotalScore;

    // C. Calculate Metrics for Baseline
    const baseTravelTime = base.stops.reduce((acc, s) => acc + s.travelMins, 0) + base.returnMins;
    const baseDomains = new Set(base.stops.map(s => s.poi.domain)).size;
    const baseTotalScore = +base.stops.reduce((acc, s) => acc + s.scoreObj.finalScore, 0).toFixed(1);

    document.getElementById('base-total-time').textContent = `${base.totalTime}m`;
    document.getElementById('base-travel-time').textContent = `${baseTravelTime}m`;
    document.getElementById('base-domains').textContent = `${baseDomains} / 4`;
    document.getElementById('base-total-score').textContent = baseTotalScore;

    // D. Gain Callout
    const gainPct = baseTotalScore > 0 ? Math.round(((sparkTotalScore - baseTotalScore) / baseTotalScore) * 100) : 0;
    const gainBanner = document.getElementById('gain-callout');
    const gainTitle = document.getElementById('gain-title');
    const gainSub = document.getElementById('gain-sub');

    if (gainPct >= 0) {
        gainTitle.textContent = `SPARK Score Advantage: +${gainPct}% Higher`;
        gainSub.textContent = `Delivers ${sparkDomains} domains vs. ${baseDomains} in baseline within identical ${state.maxBudgetMins}m limit.`;
    } else {
        gainTitle.textContent = `SPARK Score: ${sparkTotalScore} pts`;
        gainSub.textContent = `Satisfies ${state.maxBudgetMins}m family budget window.`;
    }
}

// ── 9. Selection & Re-compute Orchestration ─────────────────────────────────
function selectPoi(poiId) {
    state.selectedPoiId = poiId;
    renderStackedBar();
    renderItineraryAndScorecard();
    if (poiMarkerMap && poiMarkerMap[poiId]) {
        poiMarkerMap[poiId].openPopup();
    }
}

function recomputeAndRender() {
    // 1. Compute routes
    state.sparkRoute = generateSparkRoute(state.domainFilter, state.maxBudgetMins);
    state.baseRoute = generateBaselineRoute(state.domainFilter, state.maxBudgetMins);

    // Set default selected POI if none selected
    if (state.sparkRoute.stops.length > 0) {
        state.selectedPoiId = state.sparkRoute.stops[0].poi.id;
    } else {
        state.selectedPoiId = POIS[0].id;
    }

    // 2. Render all 3 views
    updateMapDisplay();
    renderRadarChart();
    renderStackedBar();
    renderItineraryAndScorecard();
}

// ── 10. Geocoding & Start Address Management ───────────────────────────────
const PRESET_GEOCODES = {
    "pershing square": { name: "Pershing Square (DTLA)", lat: 34.0488, lon: -118.2518 },
    "union station": { name: "Union Station (DTLA)", lat: 34.0562, lon: -118.2365 },
    "grand park": { name: "Grand Park / City Hall", lat: 34.0537, lon: -118.2458 },
    "crypto.com arena": { name: "Crypto.com Arena / South Park", lat: 34.0430, lon: -118.2673 },
    "echo park": { name: "Echo Park Lake", lat: 34.0722, lon: -118.2606 },
    "arts district": { name: "Arts District (DTLA)", lat: 34.0475, lon: -118.2368 }
};

async function setHomeAddress(query) {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim().toLowerCase();

    // 1. Instant check against local presets
    for (const [key, val] of Object.entries(PRESET_GEOCODES)) {
        if (cleanQuery.includes(key)) {
            applyNewHome(val.name, val.lat, val.lon);
            return;
        }
    }

    const btn = document.getElementById('set-home-btn');
    if (btn) {
        btn.textContent = '...';
        btn.disabled = true;
    }

    // Append 'Los Angeles, CA' if omitted to constrain OpenStreetMap search to LA
    const searchQuery = cleanQuery.includes('los angeles') || cleanQuery.includes('la') 
        ? query 
        : `${query}, Los Angeles, CA`;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const shortName = data[0].display_name.split(',')[0];
            applyNewHome(shortName || query, lat, lon);
        } else {
            alert(`Could not find coordinates for "${query}". Try typing a DTLA street, e.g. "7th and Grand" or selecting a preset.`);
        }
    } catch (err) {
        console.warn('Geocoding request failed:', err);
        alert('Geocoding service unavailable. Using default DTLA center.');
    } finally {
        if (btn) {
            btn.textContent = 'Update';
            btn.disabled = false;
        }
    }
}

function applyNewHome(name, lat, lon) {
    CAREGIVER_START.name = name;
    CAREGIVER_START.lat = lat;
    CAREGIVER_START.lon = lon;

    if (homeMarker) {
        homeMarker.setLatLng([lat, lon]);
        homeMarker.setPopupContent(`<strong>${name}</strong><br><span style="color:#64748b">Start & Return Point</span>`);
    }

    const badge = document.getElementById('profile-start-label');
    if (badge) {
        badge.textContent = name.length > 13 ? name.substring(0, 13) + '…' : name;
    }

    if (map) {
        map.panTo([lat, lon]);
    }

    recomputeAndRender();
}

// ── 11. Event Listeners & Boot ──────────────────────────────────────────────
function setupEvents() {
    const homeInput = document.getElementById('home-address-input');
    const setHomeBtn = document.getElementById('set-home-btn');
    if (setHomeBtn && homeInput) {
        setHomeBtn.addEventListener('click', () => {
            setHomeAddress(homeInput.value);
        });
        homeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setHomeAddress(homeInput.value);
            }
        });
        homeInput.addEventListener('change', () => {
            setHomeAddress(homeInput.value);
        });
    }

    const domainSelect = document.getElementById('domain-select');
    domainSelect.addEventListener('change', (e) => {
        state.domainFilter = e.target.value;
        recomputeAndRender();
    });

    const timeSlider = document.getElementById('time-budget-slider');
    const timeVal = document.getElementById('time-budget-val');
    timeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.maxBudgetMins = val;
        const hrs = (val / 60).toFixed(1);
        timeVal.textContent = `${val} mins (${hrs} hrs)`;
        recomputeAndRender();
    });

    const exportBtn = document.getElementById('export-eval-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportEvaluationData();
        });
    }
}

// Window load init
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEvents();
    updateEvaluationUI();

    // Dynamically fetch latest data/dtla_pois.json if hosted on server, otherwise use embedded poi.db records
    fetch('data/dtla_pois.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                POIS = data;
                console.log(`Loaded ${POIS.length} POIs dynamically from data/dtla_pois.json`);
            }
        })
        .catch(err => {
            console.log('Serving embedded poi.db records directly');
        })
        .finally(() => {
            recomputeAndRender();
        });
});
