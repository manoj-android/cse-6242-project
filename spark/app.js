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

// Child Personas / Scenarios (Section 12 of Simplified Spec)
const CHILD_PERSONAS = {
    balanced: {
        label: "Scenario B: Balanced",
        needs: { Motor: 8.0, Cognitive: 7.5, Social: 8.0, Creative: 7.5 },
        desc: "Equal multi-domain balance across motor, learning, social, and imaginative play."
    },
    active: {
        label: "Scenario A: Active",
        needs: { Motor: 9.5, Cognitive: 4.5, Social: 8.5, Creative: 5.0 },
        desc: "High gross motor & physical energy; prioritizes sports pitches, ballgames & athletics."
    },
    learning: {
        label: "Scenario C: Cognitive",
        needs: { Motor: 5.0, Cognitive: 9.5, Social: 6.0, Creative: 8.5 },
        desc: "High learning curiosity; scientific discovery, libraries, and historic heritage sites."
    },
    creative: {
        label: "Creative Explorer",
        needs: { Motor: 6.0, Cognitive: 7.0, Social: 6.5, Creative: 9.5 },
        desc: "Botanical gardens, sensory arts, imaginative storytelling, and open-ended building."
    }
};

// Pediatric Developmental Age Brackets (Derived from SQLite age_points model)
const AGE_STAGES = {
    2: { label: "2 years old", stage: "🍼 Toddler (Sensory & Gross Motor)" },
    3: { label: "3 years old", stage: "🍼 Early Preschool (Playground & Splash)" },
    4: { label: "4 years old", stage: "🧸 Preschool (Imaginative & Social Play)" },
    5: { label: "5 years old", stage: "🧸 Kindergarten (Storytelling & Motor Play)" },
    6: { label: "6 years old", stage: "🎒 Early Elementary (Curiosity & Games)" },
    7: { label: "7 years old", stage: "🎒 Primary School (Discovery & STEM Puzzles)" },
    8: { label: "8 years old", stage: "🎒 Elementary (Science, Sports & Museums)" },
    9: { label: "9 years old", stage: "🔍 Late Elementary (Scavenger Hunts & Arts)" },
    10: { label: "10 years old", stage: "🔬 Pre-Teen (Autonomous Inquiry & Exhibits)" },
    11: { label: "11 years old", stage: "🔬 Pre-Teen (Advanced Heritage & Culture)" },
    12: { label: "12 years old", stage: "🏛️ Middle School (Complex Cultural Discovery)" }
};

let currentPersonaKey = 'balanced';
let CHILD_TARGET_NEEDS = { ...CHILD_PERSONAS.balanced.needs };

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

// Great-circle Haversine formula in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
    return haversineMiles(lat1, lon1, lat2, lon2) * 1.60934;
}

// Estimate urban transit minutes from straight-line miles (limitation noted in UI)
function estimateTravelMins(distMiles) {
    // 3.5 mins per straight-line mile + 2 mins parking/turn penalty
    return Math.max(3, Math.round(distMiles * 3.5 + 2));
}

// ── 3.1 SQLite 8D Pediatric Factors & Activity Taxonomy (poi.db) ─────────────
const PEDIATRIC_FACTORS = [
    "soc_emot", "cog_exec", "lang_comm", "phys_motor",
    "expl_creat", "found_knowl", "ind_lifeskills", "health"
];

const SQLITE_ACTIVITY_POINTS = {
    "arcade_games": { soc_emot: 3, cog_exec: 9, lang_comm: 5, phys_motor: 6, expl_creat: 8, found_knowl: 6, ind_lifeskills: 5, health: 5 },
    "bowling": { soc_emot: 10, cog_exec: 7, lang_comm: 6, phys_motor: 8, expl_creat: 7, found_knowl: 6, ind_lifeskills: 5, health: 7 },
    "ballgames": { soc_emot: 9, cog_exec: 8, lang_comm: 7, phys_motor: 10, expl_creat: 7, found_knowl: 5, ind_lifeskills: 6, health: 8 },
    "soccer": { soc_emot: 9, cog_exec: 8, lang_comm: 7, phys_motor: 10, expl_creat: 7, found_knowl: 5, ind_lifeskills: 6, health: 8 },
    "softball": { soc_emot: 9, cog_exec: 8, lang_comm: 7, phys_motor: 10, expl_creat: 7, found_knowl: 5, ind_lifeskills: 6, health: 8 },
    "picknick": { soc_emot: 10, cog_exec: 9, lang_comm: 9, phys_motor: 2, expl_creat: 7, found_knowl: 9, ind_lifeskills: 7, health: 8 },
    "hide-and-seek": { soc_emot: 8, cog_exec: 8, lang_comm: 6, phys_motor: 9, expl_creat: 9, found_knowl: 6, ind_lifeskills: 8, health: 7 },
    "free play": { soc_emot: 7, cog_exec: 8, lang_comm: 7, phys_motor: 7, expl_creat: 10, found_knowl: 6, ind_lifeskills: 9, health: 7 },
    "build sand castle": { soc_emot: 9, cog_exec: 7, lang_comm: 7, phys_motor: 8, expl_creat: 9, found_knowl: 8, ind_lifeskills: 7, health: 7 },
    "play tag": { soc_emot: 8, cog_exec: 7, lang_comm: 6, phys_motor: 9, expl_creat: 6, found_knowl: 5, ind_lifeskills: 7, health: 6 },
    "swimming": { soc_emot: 6, cog_exec: 6, lang_comm: 4, phys_motor: 9, expl_creat: 6, found_knowl: 6, ind_lifeskills: 9, health: 7 }
};

const SQLITE_AGE_POINTS = [
    { min_age: 0, max_age: 2, soc_emot: 10, cog_exec: 8, lang_comm: 9, phys_motor: 10, expl_creat: 9, found_knowl: 2, ind_lifeskills: 3, health: 8 },
    { min_age: 2, max_age: 4, soc_emot: 9, cog_exec: 8, lang_comm: 10, phys_motor: 8, expl_creat: 10, found_knowl: 4, ind_lifeskills: 6, health: 7 },
    { min_age: 4, max_age: 6, soc_emot: 9, cog_exec: 8, lang_comm: 9, phys_motor: 8, expl_creat: 9, found_knowl: 7, ind_lifeskills: 7, health: 7 },
    { min_age: 6, max_age: 8, soc_emot: 8, cog_exec: 9, lang_comm: 8, phys_motor: 7, expl_creat: 7, found_knowl: 10, ind_lifeskills: 8, health: 7 },
    { min_age: 8, max_age: 12, soc_emot: 8, cog_exec: 9, lang_comm: 7, phys_motor: 7, expl_creat: 9, found_knowl: 9, ind_lifeskills: 9, health: 8 },
    { min_age: 13, max_age: 18, soc_emot: 9, cog_exec: 8, lang_comm: 8, phys_motor: 7, expl_creat: 8, found_knowl: 7, ind_lifeskills: 10, health: 9 }
];

function getNormalizedAgeWeights(age) {
    const a = Number(age) || 5;
    let bracket = SQLITE_AGE_POINTS.find(b => a >= b.min_age && a < b.max_age);
    if (!bracket) {
        bracket = (a <= 2) ? SQLITE_AGE_POINTS[0] : SQLITE_AGE_POINTS[SQLITE_AGE_POINTS.length - 1];
    }
    const weights = {};
    let sum = 0;
    PEDIATRIC_FACTORS.forEach(f => {
        weights[f] = bracket[f];
        sum += bracket[f];
    });
    PEDIATRIC_FACTORS.forEach(f => {
        weights[f] = weights[f] / (sum || 1);
    });
    return weights;
}

// Dynamic Pediatric Age Fit (Derived from SQLite age_points 6-bracket taxonomy)
function computeDynamicAgeFit(poi, childAge) {
    const age = Number(childAge) || 5;
    
    // Parse POI age range (default 3-8 if unspecified)
    let minAge = 3;
    let maxAge = 8;
    if (poi.age_range && typeof poi.age_range === 'string') {
        const parts = poi.age_range.split('-').map(s => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            minAge = parts[0];
            maxAge = parts[1];
        }
    }

    const lowerName = (poi.name || '').toLowerCase();
    const isMuseumOrLibrary = lowerName.includes('library') || lowerName.includes('museum') || lowerName.includes('art') || lowerName.includes('institute') || lowerName.includes('memorial') || lowerName.includes('monument');
    const isPlaygroundOrPark = lowerName.includes('playground') || lowerName.includes('splash') || lowerName.includes('park') || lowerName.includes('lawn') || lowerName.includes('court');

    if (isMuseumOrLibrary) {
        minAge = Math.max(minAge, 5);
        maxAge = Math.max(maxAge, 12);
    } else if (isPlaygroundOrPark) {
        minAge = Math.min(minAge, 2);
        maxAge = Math.min(maxAge, 9);
    }

    const center = (minAge + maxAge) / 2;
    const halfSpan = Math.max(1, (maxAge - minAge) / 2);

    let fit = 9.2;
    if (age >= minAge && age <= maxAge) {
        const dist = Math.abs(age - center);
        fit = 9.8 - (dist / halfSpan) * 0.8;
    } else if (age < minAge) {
        const diff = minAge - age;
        fit = Math.max(3.0, 8.8 - diff * 1.8);
    } else {
        const diff = age - maxAge;
        fit = Math.max(3.5, 8.8 - diff * 1.4);
    }

    return +Math.min(10, Math.max(1, fit)).toFixed(1);
}

// Compute fit components and final score for a POI from current location
function computePoiScore(poi, curLat, curLon, coveredDomains = null) {
    const dist = haversineMiles(curLat, curLon, poi.lat, poi.lon);
    const travelMins = estimateTravelMins(dist);

    // Persona-adaptive multiplier (Section 8 of Simplified Spec):
    const targetVal = CHILD_TARGET_NEEDS[poi.domain] || 7.5;
    const personaMultiplier = targetVal / 7.5;

    // Dynamic Pediatric Age Fit
    const currentAge = (state && state.childAge) ? state.childAge : 5;
    const dynamicAgeFit = computeDynamicAgeFit(poi, currentAge);

    // Formula: 0.60 * dev_fit * personaMultiplier + 0.25 * dynamicAgeFit + 0.15 * pref_fit + diversityBonus - lambda * travel_penalty
    const devPart = +(0.60 * poi.dev_fit * personaMultiplier).toFixed(2);
    const agePart = +(0.25 * dynamicAgeFit).toFixed(2);
    const prefPart = +(0.15 * poi.pref_fit).toFixed(2);
    const lambda = (state && state.lambda !== undefined) ? state.lambda : 0.12;
    const penalty = +(travelMins * lambda).toFixed(2);

    // Diversity Bonus (Section 9 of Simplified Spec):
    let diversityBonus = 0;
    if (coveredDomains && coveredDomains.size > 0 && !coveredDomains.has(poi.domain)) {
        diversityBonus = 1.0;
    }

    const finalScore = +(devPart + agePart + prefPart + diversityBonus - penalty).toFixed(2);

    return {
        distMiles: +dist.toFixed(2),
        travelMins,
        devPart,
        agePart,
        prefPart,
        dynamicAgeFit,
        diversityBonus,
        penalty,
        finalScore: Math.max(0.1, finalScore)
    };
}

// ── 4. Routing & Optimization Engine (SparkCode.ipynb + 2-Opt TSP) ───────────

// Extract activity factors or construct reasonable defaults
function getActivityFactors(actName) {
    const clean = (actName || '').split('(')[0].trim().toLowerCase();
    for (const [key, val] of Object.entries(SQLITE_ACTIVITY_POINTS)) {
        if (clean.includes(key) || key.includes(clean)) {
            return { name: key, scores: val };
        }
    }
    // Generic fallback
    return {
        name: actName || 'play',
        scores: { soc_emot: 8, cog_exec: 8, lang_comm: 7, phys_motor: 8, expl_creat: 8, found_knowl: 6, ind_lifeskills: 7, health: 7 }
    };
}

// A. Simulated Annealing Multi-Objective Optimizer (SparkCode.ipynb logic)
function generateSparkRoute(domainFilter, maxBudgetMins) {
    const maxRadius = (state && state.maxRadiusMiles !== undefined) ? state.maxRadiusMiles : 3.0;
    const childAge = (state && state.childAge) ? state.childAge : 5;
    const ageWeights = getNormalizedAgeWeights(childAge);

    // 1. Filter venues by radius from origin and domain filter
    let pool = POIS.filter(p => {
        const matchesDomain = (domainFilter === 'all' || p.domain === domainFilter);
        const distFromHome = haversineMiles(CAREGIVER_START.lat, CAREGIVER_START.lon, p.lat, p.lon);
        return matchesDomain && distFromHome <= maxRadius;
    });

    if (pool.length === 0) {
        return { stops: [], returnMins: 0, totalTime: 0, domainCoverage: { Motor: 0, Cognitive: 0, Social: 0, Creative: 0 } };
    }

    // 2. Build candidate items: (poi, activity, normalized 8D vector)
    const candidates = [];
    pool.forEach(p => {
        const distFromHome = haversineMiles(CAREGIVER_START.lat, CAREGIVER_START.lon, p.lat, p.lon);
        const actList = (p.activities && p.activities.length > 0) ? p.activities : ['free play'];
        actList.forEach(actStr => {
            const parsed = getActivityFactors(actStr);
            // Normalized scores (S - 1) / 9 clipped to [0, 1]
            const normScores = {};
            PEDIATRIC_FACTORS.forEach(f => {
                normScores[f] = Math.max(0, Math.min(1, (parsed.scores[f] - 1) / 9));
            });
            candidates.push({
                poi: p,
                activityName: parsed.name,
                rawActivityString: actStr,
                factorScores: normScores,
                rawFactors: parsed.scores,
                distFromHome: distFromHome,
                normDist: Math.min(1.0, distFromHome / Math.max(0.1, maxRadius))
            });
        });
    });

    // Whichever is least: userRequestedStops vs available distinct activities/venues
    const userRequestedStops = (state && state.maxStops) ? state.maxStops : 2;
    const effectiveStopLimit = Math.min(userRequestedStops, pool.length);

    if (effectiveStopLimit === 0 || candidates.length === 0) {
        return { stops: [], returnMins: 0, totalTime: 0, domainCoverage: { Motor: 0, Cognitive: 0, Social: 0, Creative: 0 } };
    }

    // 3. Simulated Annealing Objective Function
    const lambda = (state && state.lambda !== undefined) ? state.lambda : 0.12;
    const distancePenalty = lambda; // Higher lambda = higher distance penalty
    const redundancyPenalty = 0.10;

    // Helper: compute cosine redundancy between selected candidates
    function calcRedundancy(items) {
        if (items.length <= 1) return 0;
        let sumSim = 0;
        let pairs = 0;
        for (let i = 0; i < items.length - 1; i++) {
            for (let j = i + 1; j < items.length; j++) {
                // Mean-centered cosine similarity
                const v1 = items[i].factorScores;
                const v2 = items[j].factorScores;
                let mean1 = 0, mean2 = 0;
                PEDIATRIC_FACTORS.forEach(f => { mean1 += v1[f]; mean2 += v2[f]; });
                mean1 /= 8; mean2 /= 8;

                let dot = 0, norm1 = 0, norm2 = 0;
                PEDIATRIC_FACTORS.forEach(f => {
                    const c1 = v1[f] - mean1;
                    const c2 = v2[f] - mean2;
                    dot += c1 * c2;
                    norm1 += c1 * c1;
                    norm2 += c2 * c2;
                });
                norm1 = Math.sqrt(norm1);
                norm2 = Math.sqrt(norm2);
                let sim = (norm1 > 1e-6 && norm2 > 1e-6) ? (dot / (norm1 * norm2)) : 0;
                sim = Math.max(0, Math.min(1, sim)); // only positive redundancy penalized
                sumSim += sim;
                pairs++;
            }
        }
        return pairs > 0 ? (sumSim / pairs) : 0;
    }

    function evalAgenda(selected) {
        // Diminishing returns coverage: 1 - exp(-total / 2.0)
        let devValue = 0;
        PEDIATRIC_FACTORS.forEach(f => {
            let total = 0;
            selected.forEach(item => { total += item.factorScores[f]; });
            const coverage = 1.0 - Math.exp(-total / 2.0);
            devValue += ageWeights[f] * coverage;
        });

        // Distance cost
        let distCost = 0;
        selected.forEach(item => { distCost += item.normDist; });
        distCost /= selected.length;

        // Redundancy penalty
        const redundancy = calcRedundancy(selected);

        const score = devValue - (distancePenalty * distCost) - (redundancyPenalty * redundancy);
        return { score, devValue, distCost, redundancy };
    }

    // 4. Initial Solution (greedy or random distinct activities)
    let current = [];
    const usedPoiIds = new Set();
    const usedActs = new Set();
    // Prioritize distinct POIs and activities
    for (const c of candidates) {
        if (!usedPoiIds.has(c.poi.id) && !usedActs.has(c.activityName)) {
            current.push(c);
            usedPoiIds.add(c.poi.id);
            usedActs.add(c.activityName);
        }
        if (current.length === effectiveStopLimit) break;
    }
    // If needed, backfill
    if (current.length < effectiveStopLimit) {
        for (const c of candidates) {
            if (!usedPoiIds.has(c.poi.id)) {
                current.push(c);
                usedPoiIds.add(c.poi.id);
            }
            if (current.length === effectiveStopLimit) break;
        }
    }
    if (current.length < effectiveStopLimit) {
        for (const c of candidates) {
            if (!current.includes(c)) current.push(c);
            if (current.length === effectiveStopLimit) break;
        }
    }

    let currentEval = evalAgenda(current);
    let best = [...current];
    let bestScore = currentEval.score;

    // Simulated Annealing Iterations (2,500 iterations, fast in JS ~5ms)
    const iterations = 2500;
    for (let step = 0; step < iterations; step++) {
        const replaceIdx = Math.floor(Math.random() * current.length);
        const proposal = [...current];
        const swapIn = candidates[Math.floor(Math.random() * candidates.length)];
        proposal[replaceIdx] = swapIn;

        const propEval = evalAgenda(proposal);
        const temp = Math.max(0.001, 0.05 * (1.0 - step / iterations));
        const delta = propEval.score - currentEval.score;

        if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
            current = proposal;
            currentEval = propEval;
        }
        if (currentEval.score > bestScore) {
            best = [...current];
            bestScore = currentEval.score;
        }
    }

    // 5. 2-Opt TSP Search: sequence selected venues into minimal-travel round trip
    const selectedPois = best.map(b => b.poi);
    // Remove duplicate POI objects if same POI selected twice
    const uniqueSelectedPois = [];
    const seenPois = new Set();
    selectedPois.forEach(p => {
        if (!seenPois.has(p.id)) {
            seenPois.add(p.id);
            uniqueSelectedPois.push(p);
        }
    });

    let bestOrder = uniqueSelectedPois;
    if (uniqueSelectedPois.length > 1) {
        function tourDist(order) {
            let d = haversineMiles(CAREGIVER_START.lat, CAREGIVER_START.lon, order[0].lat, order[0].lon);
            for (let i = 0; i < order.length - 1; i++) {
                d += haversineMiles(order[i].lat, order[i].lon, order[i+1].lat, order[i+1].lon);
            }
            d += haversineMiles(order[order.length - 1].lat, order[order.length - 1].lon, CAREGIVER_START.lat, CAREGIVER_START.lon);
            return d;
        }

        let bestD = tourDist(bestOrder);
        let improved = true;
        while (improved) {
            improved = false;
            for (let i = 0; i < bestOrder.length - 1; i++) {
                for (let j = i + 1; j < bestOrder.length; j++) {
                    const newOrder = bestOrder.slice(0, i).concat(bestOrder.slice(i, j + 1).reverse()).concat(bestOrder.slice(j + 1));
                    const newD = tourDist(newOrder);
                    if (newD < bestD - 1e-4) {
                        bestOrder = newOrder;
                        bestD = newD;
                        improved = true;
                    }
                }
            }
        }
    }

    // 6. Build route stops with travel legs and dwell times
    let route = [];
    let curLat = CAREGIVER_START.lat;
    let curLon = CAREGIVER_START.lon;
    let timeSpent = 0;

    bestOrder.forEach(p => {
        const scoreObj = computePoiScore(p, curLat, curLon);
        route.push({
            poi: p,
            scoreObj: scoreObj,
            travelMins: scoreObj.travelMins
        });
        timeSpent += scoreObj.travelMins + p.duration;
        curLat = p.lat;
        curLon = p.lon;
    });

    // Return leg to home
    let returnMins = 0;
    if (route.length > 0) {
        const lastPoi = route[route.length - 1].poi;
        returnMins = estimateTravelMins(haversineMiles(lastPoi.lat, lastPoi.lon, CAREGIVER_START.lat, CAREGIVER_START.lon));
        timeSpent += returnMins;
    }

    // 7. Calculate 4D Domain Coverage from Diminishing Returns Model
    let factorTotals = {};
    PEDIATRIC_FACTORS.forEach(f => {
        factorTotals[f] = 0;
        best.forEach(item => { factorTotals[f] += item.factorScores[f]; });
    });
    const coverageVec = {};
    PEDIATRIC_FACTORS.forEach(f => {
        coverageVec[f] = 1.0 - Math.exp(-factorTotals[f] / 2.0);
    });

    const motorAchieved = +Math.min(10, Math.max(1, (coverageVec.phys_motor + coverageVec.health) / 2.0 * 10.0)).toFixed(1);
    const cogAchieved = +Math.min(10, Math.max(1, (coverageVec.cog_exec + coverageVec.found_knowl) / 2.0 * 10.0)).toFixed(1);
    const socAchieved = +Math.min(10, Math.max(1, (coverageVec.soc_emot + coverageVec.lang_comm) / 2.0 * 10.0)).toFixed(1);
    const creAchieved = +Math.min(10, Math.max(1, (coverageVec.expl_creat + coverageVec.ind_lifeskills) / 2.0 * 10.0)).toFixed(1);

    const finalEval = evalAgenda(best);

    return {
        stops: route,
        returnMins,
        totalTime: timeSpent,
        domainCoverage: {
            Motor: motorAchieved,
            Cognitive: cogAchieved,
            Social: socAchieved,
            Creative: creAchieved
        },
        objectiveMetrics: {
            developmentValue: +finalEval.devValue.toFixed(4),
            redundancyScore: +finalEval.redundancy.toFixed(4),
            objectiveValue: +finalEval.score.toFixed(4)
        }
    };
}

// B. Nearest-Neighbor Baseline Route (Comparison Benchmark)
// "Picks the closest POIs nearby regardless of developmental score until budget is used."
function generateBaselineRoute(domainFilter, maxBudgetMins) {
    const maxRadius = (state && state.maxRadiusMiles !== undefined) ? state.maxRadiusMiles : 3.0;

    let pool = POIS.filter(p => {
        const matchesDomain = (domainFilter === 'all' || p.domain === domainFilter);
        const distFromHome = haversineMiles(CAREGIVER_START.lat, CAREGIVER_START.lon, p.lat, p.lon);
        return matchesDomain && distFromHome <= maxRadius;
    });

    let route = [];
    let curLat = CAREGIVER_START.lat;
    let curLon = CAREGIVER_START.lon;
    let timeSpent = 0;

    let unvisited = [...pool];

    // Whichever is the least: user-entered stops vs available venues within distance radius
    const userRequestedStops = (state && state.maxStops) ? state.maxStops : 2;
    const effectiveStopLimit = Math.min(userRequestedStops, pool.length);

    while (unvisited.length > 0 && route.length < effectiveStopLimit) {
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
    childAge: 5,
    maxStops: 2, // User editable number of activity stops (1, 2, 3...)
    maxRadiusMiles: 3.0, // Within distance radius (Facebook Marketplace style)
    domainFilter: 'all',
    maxBudgetMins: 150,
    lambda: 0.12, // User trade-off priority (1=0.22 Min Transit, 2=0.12 Balanced, 3=0.04 Max Quality)
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
        target_child_age: state.childAge || 5,
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
    renderSelectedPoiDetail();
    
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
    renderSelectedPoiDetail();
    
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
let distanceCircleLayer = null;

function computeDestinationPoint(lat, lon, distanceMiles, bearingDegrees) {
    const R = 3958.8; // Earth radius in statute miles
    const d = distanceMiles / R;
    const brng = bearingDegrees * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    const lat2 = Math.asin(Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(brng));
    const lon2 = lonRad + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(latRad), Math.cos(d) - Math.sin(latRad) * Math.sin(lat2));

    return {
        lat: lat2 * 180 / Math.PI,
        lon: lon2 * 180 / Math.PI
    };
}

function updateDistanceCircle() {
    if (!map) return;
    if (distanceCircleLayer) {
        map.removeLayer(distanceCircleLayer);
        distanceCircleLayer = null;
    }
    const radMiles = state.maxRadiusMiles;
    if (radMiles && radMiles < 100) {
        const group = L.layerGroup();

        // 1. Subtle inner distance scale rings (e.g., 1 mi, 2 mi)
        if (radMiles >= 2) {
            for (let r = 1; r < radMiles; r++) {
                const innerCircle = L.circle([CAREGIVER_START.lat, CAREGIVER_START.lon], {
                    radius: r * 1609.344,
                    color: '#0284c7',
                    weight: 1,
                    dashArray: '3, 4',
                    fill: false,
                    opacity: 0.35,
                    interactive: false
                });
                group.addLayer(innerCircle);
            }
        }

        // 2. Main perimeter circle boundary
        const mainCircle = L.circle([CAREGIVER_START.lat, CAREGIVER_START.lon], {
            radius: radMiles * 1609.344, // meters
            color: '#0284c7',
            weight: 2.5,
            dashArray: '8, 6',
            fillColor: '#38bdf8',
            fillOpacity: 0.07,
            interactive: false
        });
        group.addLayer(mainCircle);

        // 3. Radial Spoke Line from Home to Perimeter (Bearing: 60 deg Northeast)
        const bearing = 60;
        const endPt = computeDestinationPoint(CAREGIVER_START.lat, CAREGIVER_START.lon, radMiles, bearing);
        const radiusLine = L.polyline([
            [CAREGIVER_START.lat, CAREGIVER_START.lon],
            [endPt.lat, endPt.lon]
        ], {
            color: '#0284c7',
            weight: 3,
            dashArray: '5, 4',
            opacity: 0.95,
            interactive: false
        });
        group.addLayer(radiusLine);

        // 4. Midpoint Distance Badge Label (e.g., "📏 3.0 mi radius")
        const midPt = computeDestinationPoint(CAREGIVER_START.lat, CAREGIVER_START.lon, radMiles / 2, bearing);
        const labelIcon = L.divIcon({
            className: 'radius-spoke-label-icon',
            html: `<div class="radius-spoke-badge">📏 ${radMiles} mi radius</div>`,
            iconSize: [120, 24],
            iconAnchor: [60, 12]
        });
        const labelMarker = L.marker([midPt.lat, midPt.lon], { icon: labelIcon, interactive: false });
        group.addLayer(labelMarker);

        // 5. Perimeter Terminal Dot
        const endTickIcon = L.divIcon({
            className: 'radius-end-tick-icon',
            html: `<div class="radius-end-tick" title="${radMiles} mile boundary"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5]
        });
        const endMarker = L.marker([endPt.lat, endPt.lon], { icon: endTickIcon, interactive: false });
        group.addLayer(endMarker);

        distanceCircleLayer = group.addTo(map);
    }
}

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

    // Add Caregiver Start Pin (Draggable for intuitive start location setting)
    const startIcon = L.divIcon({
        className: 'home-marker-icon',
        html: '🏠',
        iconSize: [26, 26]
    });
    homeMarker = L.marker([CAREGIVER_START.lat, CAREGIVER_START.lon], { 
        icon: startIcon, 
        zIndexOffset: 1000,
        draggable: true 
    })
    .addTo(map)
    .bindPopup(`<strong>${CAREGIVER_START.name}</strong><br><span style="color:#64748b">Start & Return Point</span><br><em style="font-size:0.75rem;color:#38bdf8;">(Drag to reposition start)</em>`);

    homeMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        setHomeByCoordinates(pos.lat, pos.lng, `Custom Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
    });

    // Handle "Pick on Map" click mode
    map.on('click', function(e) {
        if (pickOnMapActive) {
            setHomeByCoordinates(e.latlng.lat, e.latlng.lng, `Custom Pin (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`);
            togglePickOnMap(false);
        }
    });

    // Dismiss POI popup when mouse cursor moves away from POI marker and popup box
    map.on('mousemove', function(e) {
        if (!currentHoveredPoi || !currentHoveredMarker || isMouseInsidePopup) return;

        const markerPt = map.latLngToContainerPoint([currentHoveredPoi.lat, currentHoveredPoi.lon]);
        const cursorPt = e.containerPoint;
        const distToMarker = Math.hypot(cursorPt.x - markerPt.x, cursorPt.y - markerPt.y);

        let nearPopup = false;
        const popupEl = document.querySelector('.spark-poi-popup');
        if (popupEl) {
            const rect = popupEl.getBoundingClientRect();
            const mapRect = map.getContainer().getBoundingClientRect();
            const threshold = POI_DISMISS_THRESHOLD_PX;
            const left = rect.left - mapRect.left - threshold;
            const right = rect.right - mapRect.left + threshold;
            const top = rect.top - mapRect.top - threshold;
            const bottom = rect.bottom - mapRect.top + threshold;
            if (cursorPt.x >= left && cursorPt.x <= right && cursorPt.y >= top && cursorPt.y <= bottom) {
                nearPopup = true;
            }
        }

        // If cursor moved beyond threshold from both marker and popup, dismiss it
        if (distToMarker > POI_DISMISS_THRESHOLD_PX && !nearPopup) {
            schedulePopupDismiss();
        } else {
            cancelPopupDismiss();
        }
    });
}

// ── Hover Popup Management with Proximity Threshold ────────────────────────
let currentHoveredPoi = null;
let currentHoveredMarker = null;
let isMouseInsidePopup = false;
let popupDismissTimer = null;
const POI_DISMISS_THRESHOLD_PX = 55; // Pixels distance threshold

function openPoiPopupWithThreshold(marker, poi) {
    cancelPopupDismiss();
    currentHoveredMarker = marker;
    currentHoveredPoi = poi;
    marker.openPopup();

    setTimeout(() => {
        const popupEl = document.querySelector('.spark-poi-popup');
        if (popupEl) {
            popupEl.onmouseenter = () => {
                isMouseInsidePopup = true;
                cancelPopupDismiss();
            };
            popupEl.onmouseleave = () => {
                isMouseInsidePopup = false;
                schedulePopupDismiss();
            };
        }
    }, 40);
}

function schedulePopupDismiss() {
    if (popupDismissTimer) clearTimeout(popupDismissTimer);
    popupDismissTimer = setTimeout(() => {
        if (!isMouseInsidePopup && map) {
            map.closePopup();
            currentHoveredMarker = null;
            currentHoveredPoi = null;
        }
        popupDismissTimer = null;
    }, 140);
}

function cancelPopupDismiss() {
    if (popupDismissTimer) {
        clearTimeout(popupDismissTimer);
        popupDismissTimer = null;
    }
}

function updateMapDisplay() {
    markersLayer.clearLayers();
    routeLayer.clearLayers();
    updateDistanceCircle();

    const routeStops = state.sparkRoute.stops;
    const routePoiIds = new Set(routeStops.map(s => s.poi.id));

    poiMarkerMap = {};

    // 1. Draw all candidate POIs
    POIS.forEach(p => {
        const isSelectedDomain = (state.domainFilter === 'all' || p.domain === state.domainFilter);
        const distFromHome = haversineMiles(CAREGIVER_START.lat, CAREGIVER_START.lon, p.lat, p.lon);
        const withinRadius = (state.maxRadiusMiles >= 100) || (distFromHome <= state.maxRadiusMiles);
        const inRoute = routePoiIds.has(p.id);
        const scoreObj = computePoiScore(p, CAREGIVER_START.lat, CAREGIVER_START.lon);

        const circle = L.circleMarker([p.lat, p.lon], {
            radius: Math.max(6, Math.min(13, scoreObj.finalScore * 1.3)),
            fillColor: DOMAIN_COLORS[p.domain] || '#0284c7',
            color: inRoute ? '#0f172a' : (withinRadius ? '#334155' : '#94a3b8'),
            weight: inRoute ? 3 : 1.5,
            opacity: withinRadius ? 1 : 0.25,
            fillOpacity: withinRadius ? (isSelectedDomain ? (inRoute ? 0.95 : 0.7) : 0.15) : 0.05
        });

        circle.bindPopup(getPoiPopupHtml(p), {
            className: 'spark-poi-popup',
            maxWidth: 300,
            minWidth: 260,
            autoPan: false
        });

        circle.on('mouseover', function() {
            openPoiPopupWithThreshold(this, p);
        });

        circle.on('mouseout', function() {
            if (!isMouseInsidePopup) {
                schedulePopupDismiss();
            }
        });

        circle.on('click', () => {
            selectPoi(p.id);
            openPoiPopupWithThreshold(circle, p);
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
                minWidth: 260,
                autoPan: false
            });
            marker.on('mouseover', function() {
                openPoiPopupWithThreshold(this, stop.poi);
            });
            marker.on('mouseout', function() {
                if (!isMouseInsidePopup) {
                    schedulePopupDismiss();
                }
            });
            marker.on('click', () => {
                selectPoi(stop.poi.id);
                openPoiPopupWithThreshold(marker, stop.poi);
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

    // Calculate Route coverage per domain using 8D diminishing returns model if available
    let routeCoverage = { Motor: 0, Cognitive: 0, Social: 0, Creative: 0 };
    if (state.sparkRoute && state.sparkRoute.domainCoverage) {
        routeCoverage = { ...state.sparkRoute.domainCoverage };
    } else if (state.sparkRoute && state.sparkRoute.stops) {
        state.sparkRoute.stops.forEach(s => {
            routeCoverage[s.poi.domain] += s.scoreObj.finalScore;
        });
        DOMAINS.forEach(d => {
            routeCoverage[d] = Math.min(10, +(routeCoverage[d] * 0.9).toFixed(1));
        });
    }

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

        // Bidirectional Brushing & Linking: D3 Radar Axis Label -> Leaflet Map
        const isActive = state.domainFilter === domain;
        svg.append('text')
            .attr('x', labelX)
            .attr('y', labelY)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', DOMAIN_COLORS[domain])
            .attr('font-size', '11px')
            .attr('font-weight', isActive ? '800' : '600')
            .attr('class', `radar-axis-label ${isActive ? 'active-filter' : ''}`)
            .text(isActive ? `✓ ${domain}` : domain)
            .on('mouseover', () => {
                highlightDomainMarkers(domain);
            })
            .on('mouseout', () => {
                resetDomainMarkers();
            })
            .on('click', () => {
                // Toggle domain filter bidirectionally
                state.domainFilter = (state.domainFilter === domain) ? 'all' : domain;
                const domainSelect = document.getElementById('domain-select');
                if (domainSelect) domainSelect.value = state.domainFilter;
                recomputeAndRender();
            });
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

// Bidirectional Brushing: Highlight domain markers on map from D3 interaction
function highlightDomainMarkers(domain) {
    if (!poiMarkerMap) return;
    POIS.forEach(p => {
        const marker = poiMarkerMap[p.id];
        if (!marker) return;
        if (p.domain === domain) {
            marker.setStyle({
                radius: 12,
                color: '#38bdf8',
                weight: 3.5,
                fillOpacity: 0.95
            });
            if (marker.bringToFront) marker.bringToFront();
        } else {
            marker.setStyle({
                fillOpacity: 0.15,
                weight: 1
            });
        }
    });
}

function resetDomainMarkers() {
    updateMapDisplay();
}

function highlightPoiMarker(poiId) {
    if (!poiMarkerMap) return;
    const marker = poiMarkerMap[poiId];
    if (marker) {
        marker.setStyle({
            radius: 12,
            color: '#fbbf24',
            weight: 3.5,
            fillOpacity: 1.0
        });
        if (marker.bringToFront) marker.bringToFront();
    }
}

function resetPoiMarker(poiId) {
    if (!poiMarkerMap) return;
    const marker = poiMarkerMap[poiId];
    if (marker) {
        const inRoute = state.sparkRoute.stops.some(s => s.poi.id === poiId);
        const isSelected = state.selectedPoiId === poiId;
        marker.setStyle({
            radius: isSelected ? 10 : (inRoute ? 8 : 5),
            color: isSelected ? '#fbbf24' : (inRoute ? '#38bdf8' : '#ffffff'),
            weight: inRoute || isSelected ? 2.5 : 1,
            fillOpacity: inRoute || isSelected ? 0.9 : 0.6
        });
    }
}

// Chart B: D3 Interactive Pareto Trade-Off Scatterplot (Distance vs. Quality)
function renderParetoChart() {
    const container = document.getElementById('pareto-chart');
    if (!container) return;
    container.innerHTML = '';

    const width = 340;
    const height = 175;
    const margin = { top: 12, right: 18, bottom: 28, left: 34 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Filter candidate points by active domain filter
    const candidatePois = POIS.filter(p => state.domainFilter === 'all' || p.domain === state.domainFilter);
    if (candidatePois.length === 0) return;

    // Map into scatterplot data points
    const routeStopIds = new Set(state.sparkRoute.stops.map(s => s.poi.id));
    const data = candidatePois.map(p => {
        const distKm = haversineDistance(CAREGIVER_START.lat, CAREGIVER_START.lon, p.lat, p.lon);
        const travelMins = +(distKm * 4).toFixed(1);
        const scoreObj = computePoiScore(p, CAREGIVER_START.lat, CAREGIVER_START.lon);
        return {
            id: p.id,
            name: p.name,
            domain: p.domain,
            travelMins: travelMins,
            score: scoreObj.finalScore,
            devFit: scoreObj.devPart,
            inRoute: routeStopIds.has(p.id),
            isSelected: state.selectedPoiId === p.id,
            poi: p
        };
    });

    // Compute Pareto Frontier (Min Travel Time X, Max Score Y)
    const sorted = [...data].sort((a, b) => a.travelMins - b.travelMins || b.score - a.score);
    let maxScoreSeen = -1;
    const paretoPoints = [];

    sorted.forEach(d => {
        if (d.score > maxScoreSeen) {
            d.isPareto = true;
            paretoPoints.push(d);
            maxScoreSeen = d.score;
        } else {
            d.isPareto = false;
        }
    });

    const maxTravel = Math.max(14, d3.max(data, d => d.travelMins) || 15);
    const xScale = d3.scaleLinear().domain([0, maxTravel + 1]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 10]).range([innerHeight, 0]);

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gridlines
    const yGrid = [2, 4, 6, 8, 10];
    svg.selectAll('.pareto-y-grid')
        .data(yGrid)
        .enter()
        .append('line')
        .attr('class', 'pareto-y-grid')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#334155')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2,3');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}m`);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    const gX = svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);
    gX.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '9px');
    gX.selectAll('line, path').attr('stroke', '#475569');

    const gY = svg.append('g').call(yAxis);
    gY.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '9px');
    gY.selectAll('line, path').attr('stroke', '#475569');

    // Axis Labels
    svg.append('text')
        .attr('x', innerWidth)
        .attr('y', innerHeight + 22)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '8.5px')
        .text('Transit (mins) →');

    svg.append('text')
        .attr('x', 0)
        .attr('y', -3)
        .attr('text-anchor', 'start')
        .attr('fill', '#64748b')
        .attr('font-size', '8.5px')
        .text('↑ Score (0-10)');

    // Render Pareto Frontier Stepped Line & Area
    if (paretoPoints.length > 0) {
        const stepPathData = [];
        stepPathData.push({ x: 0, y: paretoPoints[0].score });
        paretoPoints.forEach(p => {
            stepPathData.push({ x: p.travelMins, y: p.score });
        });
        stepPathData.push({ x: maxTravel + 1, y: paretoPoints[paretoPoints.length - 1].score });

        const lineGen = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveStepAfter);

        const areaGen = d3.area()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveStepAfter);

        // Shaded area under frontier
        svg.append('path')
            .datum(stepPathData)
            .attr('fill', 'rgba(251, 191, 36, 0.06)')
            .attr('d', areaGen);

        // Frontier stepped dashed line
        svg.append('path')
            .datum(stepPathData)
            .attr('fill', 'none')
            .attr('stroke', '#fbbf24')
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.85);
    }

    // Sequence path connecting active itinerary stops in order
    const routePoints = state.sparkRoute.stops.map(s => {
        return data.find(d => d.id === s.poi.id);
    }).filter(Boolean);

    if (routePoints.length > 1) {
        const routeLineGen = d3.line()
            .x(d => xScale(d.travelMins))
            .y(d => yScale(d.score));

        svg.append('path')
            .datum(routePoints)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 1.2)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0.5);
    }

    // Tooltip reference
    let tooltip = document.getElementById('pareto-tooltip-el');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'pareto-tooltip-el';
        tooltip.className = 'pareto-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
    }

    // Render Candidate Points
    const dots = svg.selectAll('.pareto-dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'pareto-dot')
        .attr('cx', d => xScale(d.travelMins))
        .attr('cy', d => yScale(d.score))
        .attr('r', d => d.isSelected ? 7.5 : (d.inRoute ? 6 : 4))
        .attr('fill', d => DOMAIN_COLORS[d.domain] || '#38bdf8')
        .attr('stroke', d => d.isSelected ? '#ffffff' : (d.inRoute ? '#38bdf8' : (d.isPareto ? '#fbbf24' : '#1e293b')))
        .attr('stroke-width', d => d.isSelected ? 2.5 : (d.inRoute || d.isPareto ? 1.8 : 0.8))
        .attr('opacity', d => d.inRoute || d.isSelected || d.isPareto ? 1.0 : 0.65);

    dots.on('mouseover', function(event, d) {
        d3.select(this)
            .attr('r', 8.5)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        highlightPoiMarker(d.id);

        tooltip.innerHTML = `
            <div style="font-weight:700;color:#f8fafc;margin-bottom:2px">${d.name}</div>
            <div style="display:flex;gap:6px;font-size:0.65rem;color:#94a3b8">
                <span style="color:${DOMAIN_COLORS[d.domain]}">${d.domain}</span>
                <span>⏱ ${d.travelMins}m transit</span>
                <span style="color:#fbbf24">★ ${d.score}/10</span>
            </div>
            ${d.isPareto ? '<div style="color:#fbbf24;font-size:0.62rem;margin-top:2px">⚡ Pareto-optimal trade-off stop</div>' : ''}
            ${d.inRoute ? '<div style="color:#38bdf8;font-size:0.62rem;margin-top:1px">✓ Active Itinerary Stop</div>' : ''}
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 12) + 'px';
        tooltip.style.top = (event.pageY - 28) + 'px';
    })
    .on('mousemove', function(event) {
        tooltip.style.left = (event.pageX + 12) + 'px';
        tooltip.style.top = (event.pageY - 28) + 'px';
    })
    .on('mouseout', function(event, d) {
        d3.select(this)
            .attr('r', d.isSelected ? 7.5 : (d.inRoute ? 6 : 4))
            .attr('stroke', d.isSelected ? '#ffffff' : (d.inRoute ? '#38bdf8' : (d.isPareto ? '#fbbf24' : '#1e293b')))
            .attr('stroke-width', d.isSelected ? 2.5 : (d.inRoute || d.isPareto ? 1.8 : 0.8));

        resetPoiMarker(d.id);
        tooltip.style.display = 'none';
    })
    .on('click', function(event, d) {
        tooltip.style.display = 'none';
        selectPoi(d.id);
    });
}

// Chart C: D3 Stacked Bar for Selected POI
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
    if (score.diversityBonus > 0) {
        segments.push({ label: 'Diversity', val: score.diversityBonus, color: '#fbbf24' });
    }

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

    // E. Update Section 11 Benchmark Table
    const tblBaseScore = document.getElementById('tbl-base-score');
    if (tblBaseScore) {
        tblBaseScore.textContent = `${baseTotalScore} pts`;
        document.getElementById('tbl-spark-score').textContent = `${sparkTotalScore} pts`;
        document.getElementById('tbl-gain-score').textContent = `+${gainPct}% Quality Gain`;
        
        document.getElementById('tbl-base-domains').textContent = `${baseDomains} / 4 Domains`;
        document.getElementById('tbl-spark-domains').textContent = `${sparkDomains} / 4 Domains`;
        
        document.getElementById('tbl-base-travel').textContent = `${baseTravelTime} mins`;
        document.getElementById('tbl-spark-travel').textContent = `${sparkTravelTime} mins`;
        const travelDiff = sparkTravelTime - baseTravelTime;
        document.getElementById('tbl-gain-travel').textContent = travelDiff >= 0 ? `+${travelDiff} mins` : `${travelDiff} mins`;
        
        document.getElementById('tbl-base-total').textContent = `${base.totalTime} mins`;
        document.getElementById('tbl-spark-total').textContent = `${spark.totalTime} mins`;
    }

    // Render the primary user-requested outputs:
    renderJourneyRibbon();
    renderItineraryCards();
    fitMapToRenderedRoute();
}

// ── D3 Outing Journey Ribbon (Temporal Journey Flow Strip) ───────────────────
function renderJourneyRibbon() {
    const container = document.getElementById('journey-ribbon-viz');
    if (!container) return;
    container.innerHTML = '';

    const spark = state.sparkRoute;
    if (!spark || !spark.stops || spark.stops.length === 0) {
        container.innerHTML = '<span style="color:#64748b;font-size:0.75rem">No route generated for current settings.</span>';
        return;
    }

    const width = container.clientWidth || 430;
    const height = 40;

    const totalMins = Math.max(30, spark.totalTime || 90);
    const xScale = d3.scaleLinear().domain([0, totalMins]).range([0, width]);

    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('display', 'block');

    let curX = 0;

    spark.stops.forEach((stop, i) => {
        // 1. Travel segment
        const travelW = Math.max(22, xScale(stop.travelMins));
        const travelG = svg.append('g')
            .attr('transform', `translate(${curX}, 4)`);

        travelG.append('rect')
            .attr('width', travelW)
            .attr('height', 30)
            .attr('fill', '#1e293b')
            .attr('stroke', '#334155')
            .attr('rx', 4);

        travelG.append('text')
            .attr('x', travelW / 2)
            .attr('y', 19)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .text(`🚗 ${stop.travelMins}m`);

        curX += travelW + 3;

        // 2. Stop segment
        const stopW = Math.max(58, xScale(stop.poi.duration));
        const stopColor = DOMAIN_COLORS[stop.poi.domain] || '#38bdf8';
        const isSelected = stop.poi.id === state.selectedPoiId;

        const stopG = svg.append('g')
            .attr('transform', `translate(${curX}, 4)`)
            .style('cursor', 'pointer')
            .on('click', () => selectPoi(stop.poi.id))
            .on('mouseover', () => highlightPoiMarker(stop.poi.id))
            .on('mouseout', () => resetPoiMarker(stop.poi.id));

        stopG.append('rect')
            .attr('width', stopW)
            .attr('height', 30)
            .attr('fill', stopColor)
            .attr('opacity', isSelected ? 1.0 : 0.88)
            .attr('stroke', isSelected ? '#ffffff' : 'none')
            .attr('stroke-width', isSelected ? 2 : 0)
            .attr('rx', 4);

        const shortName = stop.poi.name.length > 11 ? stop.poi.name.slice(0, 10) + '…' : stop.poi.name;
        stopG.append('text')
            .attr('x', stopW / 2)
            .attr('y', 14)
            .attr('text-anchor', 'middle')
            .attr('fill', '#0f172a')
            .attr('font-size', '9.5px')
            .attr('font-weight', '700')
            .text(`${i + 1}. ${shortName}`);

        stopG.append('text')
            .attr('x', stopW / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('fill', '#0f172a')
            .attr('font-size', '8.5px')
            .attr('font-weight', '600')
            .text(`${stop.poi.duration}m`);

        curX += stopW + 3;
    });

    // Return segment
    if (spark.returnMins > 0) {
        const retW = Math.max(22, xScale(spark.returnMins));
        const retG = svg.append('g')
            .attr('transform', `translate(${curX}, 4)`);

        retG.append('rect')
            .attr('width', retW)
            .attr('height', 30)
            .attr('fill', '#1e293b')
            .attr('stroke', '#334155')
            .attr('rx', 4);

        retG.append('text')
            .attr('x', retW / 2)
            .attr('y', 19)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .text(`🚗 ${spark.returnMins}m`);
    }
}

// ── Render Card-Based Activity & Itinerary List ──────────────────────────────
function renderItineraryCards() {
    const container = document.getElementById('rendered-activities-list');
    const summaryPill = document.getElementById('itinerary-summary-pill');
    if (!container) return;
    container.innerHTML = '';

    const spark = state.sparkRoute;
    if (!spark || !spark.stops || spark.stops.length === 0) {
        container.innerHTML = `
            <div style="padding:24px;text-align:center;color:#94a3b8">
                No activity destinations found for current constraints. Try adjusting child's age or increasing stop count.
            </div>
        `;
        if (summaryPill) summaryPill.textContent = '0 Stops';
        return;
    }

    if (summaryPill) {
        summaryPill.textContent = `${spark.stops.length} Stop${spark.stops.length > 1 ? 's' : ''} · ~${spark.totalTime} mins total`;
    }

    // Departure Card
    container.innerHTML += `
        <div class="itin-leg-card">
            <span style="font-size:1.1rem">🏠</span>
            <span><strong>Start:</strong> Depart from ${CAREGIVER_START.name}</span>
        </div>
    `;

    spark.stops.forEach((stop, idx) => {
        const poi = stop.poi;
        const isSelected = poi.id === state.selectedPoiId;
        const poiEval = state.evaluations[poi.id] || { poiVote: 0, activities: {} };
        const upActive = poiEval.poiVote === 1 ? 'active up' : '';
        const downActive = poiEval.poiVote === -1 ? 'active down' : '';

        // Driving leg
        container.innerHTML += `
            <div class="itin-leg-card">
                <span>🚗</span>
                <span>Drive <strong>${stop.travelMins} mins</strong> (${stop.distMiles} mi) to Stop ${idx + 1}</span>
            </div>
        `;

        // Activities List
        let activitiesHtml = '';
        if (poi.activities && poi.activities.length > 0) {
            activitiesHtml = poi.activities.map(actStr => {
                const parts = actStr.split('(');
                const rawName = parts[0].trim();
                const scorePart = parts[1] ? parts[1].replace(')', '').trim() : '';
                return `
                    <li class="activity-item">
                        <div class="activity-item-left">
                            <span class="activity-item-bullet">•</span>
                            <span>${rawName}</span>
                        </div>
                        ${scorePart ? `<span class="activity-item-score">★ ${scorePart}</span>` : ''}
                    </li>
                `;
            }).join('');
        } else {
            activitiesHtml = `<li class="activity-item" style="color:#64748b;font-style:italic">Open exploration & recreation</li>`;
        }

        // Stop Card HTML
        const cardHtml = `
            <div class="itin-stop-card ${isSelected ? 'active-stop' : ''}" 
                 id="itin-card-${poi.id}" 
                 onclick="selectPoi(${poi.id})"
                 onmouseenter="highlightPoiMarker(${poi.id})"
                 onmouseleave="resetPoiMarker(${poi.id})">
                
                <div class="stop-top-row">
                    <div class="stop-badge-num">${idx + 1}</div>
                    <div class="stop-title-wrap">
                        <h4 class="stop-name">${poi.name}</h4>
                        <div class="stop-meta-chips">
                            <span class="poi-badge badge-domain ${poi.domain}">${poi.domain}</span>
                            <span style="color:#94a3b8">⏱ ${poi.duration}m dwell</span>
                            <span class="stop-age-match-chip">⭐ ${stop.scoreObj.dynamicAgeFit}/10 Match for Age ${state.childAge}</span>
                        </div>
                    </div>
                </div>

                <div class="stop-activities-box">
                    <div class="stop-activities-heading">🎯 Recommended Activities for Your Child:</div>
                    <ul class="activities-list">
                        ${activitiesHtml}
                    </ul>
                </div>

                <div class="stop-footer-row">
                    <span style="font-size:0.67rem;color:#64748b">Rate recommendation fit:</span>
                    <div class="stop-vote-btns">
                        <button type="button" class="stop-vote-btn ${upActive}" 
                                onclick="event.stopPropagation(); window.votePoi(${poi.id}, 1)" 
                                title="Upvote: Excellent activity fit for child">👍 Recommended</button>
                        <button type="button" class="stop-vote-btn ${downActive}" 
                                onclick="event.stopPropagation(); window.votePoi(${poi.id}, -1)" 
                                title="Downvote: Not suitable">👎 Not for Us</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += cardHtml;
    });

    // Return to Home Card
    if (spark.stops.length > 0) {
        container.innerHTML += `
            <div class="itin-leg-card">
                <span>🚗</span>
                <span>Drive <strong>${spark.returnMins} mins</strong> return to Home (${CAREGIVER_START.name})</span>
            </div>
            <div class="itin-leg-card" style="border-left-style: solid; border-left-color: #10b981;">
                <span>🏠</span>
                <span><strong>Completed Outing:</strong> Back home in <strong>~${spark.totalTime} mins</strong> total</span>
            </div>
        `;
    }
}

// ── Auto-Resize Leaflet Map to Match Rendered Activities List Height ──────────
function fitMapToRenderedRoute() {
    if (!map) return;
    setTimeout(() => {
        map.invalidateSize(); // Resizes Leaflet canvas to match container's rendered height
        const bounds = L.latLngBounds([[CAREGIVER_START.lat, CAREGIVER_START.lon]]);
        if (state.sparkRoute && state.sparkRoute.stops && state.sparkRoute.stops.length > 0) {
            state.sparkRoute.stops.forEach(s => {
                bounds.extend([s.poi.lat, s.poi.lon]);
            });
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } else if (distanceCircleLayer) {
            map.fitBounds(distanceCircleLayer.getBounds(), { padding: [30, 30] });
        } else {
            map.setView([CAREGIVER_START.lat, CAREGIVER_START.lon], 14);
        }
    }, 70);
}

// Render Selected Stop Deep-Dive in Fit Panel (Component C)
function renderSelectedPoiDetail() {
    const container = document.getElementById('poi-detail-list-container');
    if (!container) return;

    const poi = POIS.find(p => p.id === state.selectedPoiId) ||
                (state.sparkRoute.stops[0] ? state.sparkRoute.stops[0].poi : POIS[0]);
    if (!poi) return;

    const badge = document.getElementById('selected-stop-domain-badge');
    if (badge) {
        badge.textContent = poi.domain;
        badge.className = `poi-badge badge-domain ${poi.domain}`;
    }

    const scoreObj = computePoiScore(poi, CAREGIVER_START.lat, CAREGIVER_START.lon);
    const poiEval = state.evaluations[poi.id] || { poiVote: 0, activities: {} };
    const actVotes = poiEval.activities || {};

    let actsHtml = '';
    if (poi.activities && poi.activities.length > 0) {
        actsHtml = poi.activities.map(item => {
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
                            onclick="window.voteActivity(${poi.id}, '${cleanActName}', 1);" 
                            title="Upvote: High quality developmental activity">👍</button>
                    <button type="button" class="vote-btn down ${downActive}" 
                            onclick="window.voteActivity(${poi.id}, '${cleanActName}', -1);" 
                            title="Downvote: Low relevance or poor age fit">👎</button>
                </div>
            </li>`;
        }).join('');
    } else {
        actsHtml = `<li class="popup-activity-item" style="color:#64748b;font-style:italic">No tagged activities</li>`;
    }

    const poiUpActive = poiEval.poiVote === 1 ? 'active' : '';
    const poiDownActive = poiEval.poiVote === -1 ? 'active' : '';

    container.innerHTML = `
        <div class="inpanel-poi-meta">
            <span><strong>${poi.name}</strong> (${poi.type})</span>
            <span>⏱ ${poi.duration}m dwell · ${scoreObj.distMiles} mi</span>
        </div>
        <ul class="popup-activity-list" style="max-height: 160px;">
            ${actsHtml}
        </ul>
        <div class="poi-popup-footer" style="margin-top: 6px;">
            <span style="color:#94a3b8;font-weight:600;font-size:0.72rem">Rate Venue Recommendation:</span>
            <div class="poi-vote-group">
                <button type="button" class="poi-vote-btn up ${poiUpActive}" 
                        onclick="window.votePoi(${poi.id}, 1)">👍 Recommended</button>
                <button type="button" class="poi-vote-btn down ${poiDownActive}" 
                        onclick="window.votePoi(${poi.id}, -1)">👎 Not Fit</button>
            </div>
        </div>
    `;
}

// ── 9. Selection & Re-compute Orchestration ─────────────────────────────────
function selectPoi(poiId) {
    state.selectedPoiId = poiId;
    renderParetoChart();
    renderStackedBar();
    renderSelectedPoiDetail();
    renderItineraryAndScorecard();

    // Highlight matching card in the activities list
    document.querySelectorAll('.itin-stop-card').forEach(c => {
        c.classList.toggle('active-stop', c.id === `itin-card-${poiId}`);
    });

    if (poiMarkerMap && poiMarkerMap[poiId]) {
        poiMarkerMap[poiId].openPopup();
    }
}

function recomputeAndRender() {
    // 1. Compute routes client-side for instantaneous UI feedback
    state.sparkRoute = generateSparkRoute(state.domainFilter, state.maxBudgetMins);
    state.baseRoute = generateBaselineRoute(state.domainFilter, state.maxBudgetMins);

    // Set default selected POI if none selected
    if (state.sparkRoute.stops.length > 0) {
        state.selectedPoiId = state.sparkRoute.stops[0].poi.id;
    } else {
        state.selectedPoiId = POIS[0].id;
    }

    // 2. Render all views immediately
    updateMapDisplay();
    renderRadarChart();
    renderParetoChart();
    renderStackedBar();
    renderSelectedPoiDetail();
    renderItineraryAndScorecard();

    // 3. Asynchronously query SPARK Python server API if hosted
    triggerServerApiOptimization();
}

// ── 9.1 Async SPARK Server API Integration ────────────────────────────────
let serverApiAvailable = true;
let apiAbortController = null;
let apiDebounceTimeout = null;

function triggerServerApiOptimization() {
    if (!serverApiAvailable || typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof clearTimeout !== 'undefined' && apiDebounceTimeout) {
        clearTimeout(apiDebounceTimeout);
    }
    if (typeof setTimeout === 'undefined') return;

    apiDebounceTimeout = setTimeout(async () => {
        if (apiAbortController) {
            apiAbortController.abort();
        }
        apiAbortController = new AbortController();

        const payload = {
            latitude: CAREGIVER_START.lat,
            longitude: CAREGIVER_START.lon,
            origin_name: CAREGIVER_START.name,
            child_age: (state && state.childAge) ? state.childAge : 5.0,
            radius_miles: (state && state.maxRadiusMiles !== undefined) ? state.maxRadiusMiles : 3.0,
            n_activities: (state && state.maxStops) ? state.maxStops : 2,
            distance_penalty: (state && state.tradeoffPriority !== undefined) ? state.tradeoffPriority : 0.12,
            redundancy_penalty: 0.10,
            enforce_unique_pois: true
        };

        try {
            const res = await fetch('/api/optimize_agenda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: apiAbortController.signal
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.metadata && data.metadata.optimizer_telemetry) {
                    const telem = data.metadata.optimizer_telemetry;
                    const evalLabel = document.getElementById('eval-stats-label');
                    if (evalLabel) {
                        evalLabel.innerHTML = `Model Eval: <strong>Server (${telem.execution_time_ms}ms)</strong>`;
                        evalLabel.title = `Algorithm: ${telem.algorithm} | Objective: ${telem.objective_value}`;
                    }
                }
            } else {
                // Endpoint not implemented on static file server (e.g., http.server 501); use client-side solver
                serverApiAvailable = false;
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                // Silently fallback to embedded client-side optimizer
                serverApiAvailable = false;
            }
        }
    }, 300);
}

// ── 10. Geocoding & Start Address Management ───────────────────────────────
const PRESET_GEOCODES = {
    "pershing square": { name: "Pershing Square (DTLA)", lat: 34.0488, lon: -118.2518 },
    "grand park": { name: "Grand Park / City Hall", lat: 34.0537, lon: -118.2458 },
    "union station": { name: "Union Station (DTLA)", lat: 34.0562, lon: -118.2365 },
    "crypto.com arena": { name: "Crypto.com Arena / South Park", lat: 34.0430, lon: -118.2673 },
    "crypto arena": { name: "Crypto.com Arena / South Park", lat: 34.0430, lon: -118.2673 },
    "echo park": { name: "Echo Park Lake", lat: 34.0722, lon: -118.2606 },
    "arts district": { name: "Arts District (DTLA)", lat: 34.0475, lon: -118.2368 }
};

let pickOnMapActive = false;

function togglePickOnMap(forceState) {
    pickOnMapActive = (typeof forceState === 'boolean') ? forceState : !pickOnMapActive;
    const btn = document.getElementById('btn-pick-map');
    const statusMsg = document.getElementById('home-status-msg');
    const mapEl = document.getElementById('leaflet-map');

    if (pickOnMapActive) {
        if (btn) btn.classList.add('active');
        if (mapEl) mapEl.style.cursor = 'crosshair';
        if (statusMsg) {
            statusMsg.textContent = '📍 Click anywhere on the map to set start location';
            statusMsg.className = 'home-status-msg active-mode';
        }
    } else {
        if (btn) btn.classList.remove('active');
        if (mapEl) mapEl.style.cursor = '';
        if (statusMsg && !statusMsg.className.includes('success')) {
            statusMsg.textContent = '💡 Drag 🏠 pin on map or click chips to change start';
            statusMsg.className = 'home-status-msg';
        }
    }
}

function setHomeByCoordinates(lat, lon, label) {
    const homeInput = document.getElementById('home-address-input');
    const clearBtn = document.getElementById('clear-home-btn');
    const statusMsg = document.getElementById('home-status-msg');

    if (homeInput) {
        homeInput.value = label;
        if (clearBtn) clearBtn.style.display = 'block';
    }

    updateActivePresetChip(label);
    applyNewHome(label, lat, lon);

    if (statusMsg) {
        statusMsg.textContent = `✓ Start set to: ${label}`;
        statusMsg.className = 'home-status-msg success';
        setTimeout(() => {
            if (statusMsg.className.includes('success')) {
                statusMsg.textContent = '💡 Drag 🏠 pin on map or click chips to change start';
                statusMsg.className = 'home-status-msg';
            }
        }, 4000);
    }
}

function useMyLocation() {
    const btn = document.getElementById('btn-my-location');
    const statusMsg = document.getElementById('home-status-msg');

    if (!navigator.geolocation) {
        if (statusMsg) {
            statusMsg.textContent = '⚠️ Geolocation not supported by this browser';
            statusMsg.className = 'home-status-msg';
        }
        return;
    }

    if (btn) {
        btn.textContent = '⏳ Locating...';
        btn.disabled = true;
    }
    if (statusMsg) {
        statusMsg.textContent = '🔍 Fetching current GPS location...';
        statusMsg.className = 'home-status-msg active-mode';
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            if (btn) {
                btn.textContent = '🎯 Locate Me';
                btn.disabled = false;
            }
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setHomeByCoordinates(lat, lon, `My Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        },
        (error) => {
            if (btn) {
                btn.textContent = '🎯 Locate Me';
                btn.disabled = false;
            }
            if (statusMsg) {
                statusMsg.textContent = '⚠️ GPS permission denied. Click a DTLA preset below.';
                statusMsg.className = 'home-status-msg';
            }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
}

function updateActivePresetChip(activeQuery) {
    const clean = (activeQuery || '').toLowerCase();
    document.querySelectorAll('.addr-chip').forEach(chip => {
        const chipText = chip.textContent.toLowerCase();
        const chipData = (chip.getAttribute('data-addr') || '').toLowerCase();
        if (clean.includes(chipText) || clean.includes(chipData.split(',')[0].toLowerCase())) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

async function setHomeAddress(query) {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim().toLowerCase();
    const statusMsg = document.getElementById('home-status-msg');

    // 1. Instant check against local presets
    for (const [key, val] of Object.entries(PRESET_GEOCODES)) {
        if (cleanQuery.includes(key)) {
            setHomeByCoordinates(val.lat, val.lon, val.name);
            return;
        }
    }

    const btn = document.getElementById('set-home-btn');
    if (btn) {
        btn.textContent = '...';
        btn.disabled = true;
    }
    if (statusMsg) {
        statusMsg.textContent = `🔍 Searching OpenStreetMap for "${query}"...`;
        statusMsg.className = 'home-status-msg active-mode';
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
            setHomeByCoordinates(lat, lon, shortName || query);
        } else {
            if (statusMsg) {
                statusMsg.textContent = `⚠️ Could not find "${query}". Try a DTLA preset below.`;
                statusMsg.className = 'home-status-msg';
            }
        }
    } catch (err) {
        console.warn('Geocoding request failed:', err);
        if (statusMsg) {
            statusMsg.textContent = '⚠️ Geocoding unavailable offline. Click a preset below.';
            statusMsg.className = 'home-status-msg';
        }
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
        homeMarker.setPopupContent(`<strong>${name}</strong><br><span style="color:#64748b">Start & Return Point</span><br><em style="font-size:0.75rem;color:#38bdf8;">(Drag to reposition start)</em>`);
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

function updateAgeLabelsAcrossUI() {
    const age = state.childAge || 5;
    const p = CHILD_PERSONAS[currentPersonaKey] || CHILD_PERSONAS.balanced;
    const fullLabel = `${p.label} (Age ${age})`;

    const activeScenName = document.getElementById('active-scenario-name');
    if (activeScenName) activeScenName.textContent = fullLabel;

    const badge = document.getElementById('profile-persona-label');
    if (badge) badge.textContent = fullLabel;

    // Update all age badges in scenario bar
    document.querySelectorAll('.scenario-card').forEach(c => {
        const scenAge = c.querySelector('.scenario-age');
        if (scenAge) scenAge.textContent = `Age ${age}`;
    });
}

// ── 11. Event Listeners & Boot ──────────────────────────────────────────────
function setupEvents() {
    const homeInput = document.getElementById('home-address-input');
    const setHomeBtn = document.getElementById('set-home-btn');
    const clearHomeBtn = document.getElementById('clear-home-btn');
    const btnPickMap = document.getElementById('btn-pick-map');
    const btnMyLocation = document.getElementById('btn-my-location');

    if (homeInput) {
        if (clearHomeBtn) {
            clearHomeBtn.style.display = homeInput.value ? 'block' : 'none';
            homeInput.addEventListener('input', () => {
                clearHomeBtn.style.display = homeInput.value ? 'block' : 'none';
            });
            clearHomeBtn.addEventListener('click', () => {
                homeInput.value = '';
                clearHomeBtn.style.display = 'none';
                homeInput.focus();
            });
        }

        if (setHomeBtn) {
            setHomeBtn.addEventListener('click', () => {
                setHomeAddress(homeInput.value);
            });
        }
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

    if (btnPickMap) {
        btnPickMap.addEventListener('click', () => {
            togglePickOnMap();
        });
    }

    if (btnMyLocation) {
        btnMyLocation.addEventListener('click', () => {
            useMyLocation();
        });
    }

    // Quick DTLA Address Chips
    const quickChips = document.getElementById('address-quick-chips');
    if (quickChips) {
        quickChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.addr-chip');
            if (!chip) return;
            const addr = chip.getAttribute('data-addr');
            if (addr) {
                setHomeAddress(addr);
            }
        });
    }

    // Child Age Slider (Pediatric Developmental Alignment)
    const ageSlider = document.getElementById('child-age-slider');
    const ageVal = document.getElementById('child-age-val');
    const ageChip = document.getElementById('age-stage-chip');
    if (ageSlider) {
        ageSlider.addEventListener('input', (e) => {
            const age = parseInt(e.target.value, 10);
            state.childAge = age;
            const stageInfo = AGE_STAGES[age] || { label: `${age} years old`, stage: `Child (Age ${age})` };
            if (ageVal) ageVal.textContent = stageInfo.label;
            if (ageChip) ageChip.textContent = stageInfo.stage;

            updateAgeLabelsAcrossUI();
            recomputeAndRender();
        });
    }

    // Scenario Cards in Scenario Bar (Section 12 of spec)
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenKey = card.getAttribute('data-scenario');
            if (!CHILD_PERSONAS[scenKey]) return;

            document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            currentPersonaKey = scenKey;
            const p = CHILD_PERSONAS[scenKey];
            CHILD_TARGET_NEEDS = { ...p.needs };

            const personaSelect = document.getElementById('persona-select');
            if (personaSelect) personaSelect.value = scenKey;

            updateAgeLabelsAcrossUI();
            recomputeAndRender();
        });
    });

    const personaSelect = document.getElementById('persona-select');
    if (personaSelect) {
        personaSelect.addEventListener('change', (e) => {
            currentPersonaKey = e.target.value;
            const p = CHILD_PERSONAS[currentPersonaKey] || CHILD_PERSONAS.balanced;
            CHILD_TARGET_NEEDS = { ...p.needs };

            document.querySelectorAll('.scenario-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-scenario') === currentPersonaKey);
            });
            
            updateAgeLabelsAcrossUI();
            recomputeAndRender();
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

    // Priority / Trade-off Lambda Slider (Proposal Eq. 2.4)
    const lambdaSlider = document.getElementById('lambda-slider');
    const lambdaVal = document.getElementById('lambda-val');
    const lambdaLabels = { 1: 'Min Transit (0.22)', 2: 'Balanced (0.12)', 3: 'Max Quality (0.04)' };
    const lambdaWeights = { 1: 0.22, 2: 0.12, 3: 0.04 };
    if (lambdaSlider && lambdaVal) {
        lambdaSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            state.lambda = lambdaWeights[v] || 0.12;
            lambdaVal.textContent = lambdaLabels[v] || 'Balanced (0.12)';
            recomputeAndRender();
        });
    }

    // Data Ingestion Funnel Modal (CSE 6242 Component 1 Compliance)
    const funnelBtn = document.getElementById('data-funnel-trigger');
    const modal = document.getElementById('data-funnel-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (funnelBtn && modal) {
        funnelBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    const exportBtn = document.getElementById('export-eval-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportEvaluationData();
        });
    }

    // Distance Radius Filter (Facebook Marketplace Style)
    const distSelect = document.getElementById('distance-radius-select');
    const distHint = document.getElementById('distance-hint');
    if (distSelect) {
        distSelect.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            state.maxRadiusMiles = val;
            if (distHint) {
                if (val >= 100) {
                    distHint.textContent = 'No distance restrictions';
                } else {
                    distHint.textContent = `Restricts venues to ${val}-mile radius`;
                }
            }
            recomputeAndRender();
        });
    }

    // Number of Stops Edit Box (User editable number input)
    const stopsInput = document.getElementById('max-stops-input');
    const decBtn = document.getElementById('stop-dec-btn');
    const incBtn = document.getElementById('stop-inc-btn');
    const stopsHintEl = document.getElementById('stops-hint');

    function updateStopsHint(num) {
        if (!stopsHintEl) return;
        if (num === 1) stopsHintEl.textContent = '1 stop (Quick outing)';
        else if (num === 2) stopsHintEl.textContent = '2 stops (Recommended)';
        else if (num === 3) stopsHintEl.textContent = '3 stops';
        else stopsHintEl.textContent = `${num} stops`;
    }

    function applyStopsChange(newVal) {
        let clamped = parseInt(newVal, 10);
        if (isNaN(clamped) || clamped < 1) clamped = 1;
        if (clamped > 10) clamped = 10;
        state.maxStops = clamped;
        if (stopsInput && parseInt(stopsInput.value, 10) !== clamped) {
            stopsInput.value = clamped;
        }
        updateStopsHint(clamped);
        recomputeAndRender();
    }

    if (stopsInput) {
        stopsInput.addEventListener('input', (e) => {
            if (e.target.value === '') return;
            applyStopsChange(e.target.value);
        });
        stopsInput.addEventListener('change', (e) => {
            applyStopsChange(e.target.value);
        });
    }

    if (decBtn) {
        decBtn.addEventListener('click', () => {
            const current = state.maxStops || 2;
            applyStopsChange(current - 1);
        });
    }

    if (incBtn) {
        incBtn.addEventListener('click', () => {
            const current = state.maxStops || 2;
            applyStopsChange(current + 1);
        });
    }

    // Stop Count Restriction Buttons (Legacy preset buttons fallback)
    document.querySelectorAll('.stop-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stops = parseInt(btn.getAttribute('data-stops'), 10);
            applyStopsChange(stops);
            document.querySelectorAll('.stop-choice-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Toggle Drawer Button in Topbar
    const toggleDrawerBtn = document.getElementById('toggle-drawer-btn');
    const drawerEl = document.getElementById('advanced-analytics-drawer');
    if (toggleDrawerBtn && drawerEl) {
        toggleDrawerBtn.addEventListener('click', () => {
            drawerEl.open = !drawerEl.open;
            if (drawerEl.open) {
                drawerEl.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    renderRadarChart();
                    renderParetoChart();
                    renderStackedBar();
                }, 100);
            }
        });
    }

    // Auto-Resize Leaflet Map when activities list DOM height changes
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            if (map) {
                map.invalidateSize();
            }
        });
        const itinPanel = document.getElementById('itinerary-panel');
        if (itinPanel) ro.observe(itinPanel);
    }
}

// Window load init
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEvents();
    updateEvaluationUI();
    updateAgeLabelsAcrossUI();

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
