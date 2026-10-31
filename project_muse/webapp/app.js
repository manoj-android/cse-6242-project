/* SPARK rendered page — client-side mirror of scoring.py / geo.py / routing.py.
   The Python server is the source of truth for the report; this page
   mirrors its formulas exactly so the static demo shows the same
   numbers. If a formula changes in Python, change it here too and
   re-check the worked example in the tests. */

const DOMAINS = ["cog", "phy", "soc", "emo"];
const LABELS = { cog: "Cognitive", phy: "Physical", soc: "Social", emo: "Creative / Emotional" };
const COLORS = { cog: "#2563eb", phy: "#16a34a", soc: "#ea580c", emo: "#9333ea" };
const AGE_BANDS = [
  { label: "Age 0–2", key: "0-2", age: 1 },
  { label: "Age 2–4", key: "2-4", age: 3 },
  { label: "Age 4–6", key: "4-6", age: 5 },
  { label: "Age 6–8", key: "6-8", age: 7 },
  { label: "Age 8–12", key: "8-12", age: 10 },
  { label: "Age 13–18", key: "13-18", age: 15 },
];
const STARTS = [
  { label: "Grand Park", lat: 34.0560, lon: -118.2458 },
  { label: "Pershing Square", lat: 34.0484, lon: -118.2530 },
  { label: "Downtown center", lat: 34.05, lon: -118.25 },
];

let POIS = [];
let state = {
  profile: [0.5, 0.5, 0.5, 0.5],
  ageBand: "4-6",
  start: STARTS[0],
  budget: 120,
  maxStops: 3,
  domain: "all",
  category: "all",
  selectedId: null,
};
let map, markers = new Map(), routeLayer = null;

function haversineMiles(a, b) {
  const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function travelMins(a, b) { return (haversineMiles(a, b) * 1.35) / 22.0 * 60 + 2.0; }
function cosine(u, p) {
  const dot = u.reduce((s, v, i) => s + v * p[i], 0);
  const nu = Math.hypot(...u), np = Math.hypot(...p);
  return nu === 0 || np === 0 ? 0 : Math.max(0, Math.min(1, dot / (nu * np)));
}
function dominant(vector) {
  let best = 0;
  DOMAINS.forEach((d, i) => { if (vector[d] > vector[DOMAINS[best]]) best = i; });
  return DOMAINS[best];
}
function scorePoi(poi, profile, travel) {
  const vec = DOMAINS.map((d) => poi.vector[d]);
  const fit = cosine(profile, vec);
  const penalty = Math.min(0.2, 0.01 * Math.max(0, travel - 15));
  const score = Math.max(0, Math.min(1, 0.7 * fit + 0.3 * 1.0 - penalty));
  return { ...poi, fit, age_fit: 1.0, penalty, fit_part: 0.7 * fit, age_part: 0.3, score, travel, dominant_domain: dominant(poi.vector) };
}
function routeValue(order) {
  const counts = {}, discounts = [1, 0.5, 0.25];
  return order.reduce((total, poi) => {
    const seen = counts[poi.dominant_domain] || 0;
    counts[poi.dominant_domain] = seen + 1;
    return total + discounts[Math.min(seen, 2)] * poi.score;
  }, 0);
}
function routeTime(order, start) {
  let total = 0, cur = start;
  for (const poi of order) { total += travelMins(cur, poi) + poi.dwell_mins; cur = poi; }
  return total;
}
function greedy(start, scored, budget, maxStops) {
  let remaining = budget, cur = start, counts = {}, chosen = [], used = new Set();
  while (chosen.length < maxStops) {
    let best = null, bestKey = null, bestTravel = 0;
    for (const poi of scored) {
      if (used.has(poi.id)) continue;
      const travel = travelMins(cur, poi), cost = travel + poi.dwell_mins;
      if (cost > remaining) continue;
      const seen = counts[poi.dominant_domain] || 0;
      const contribution = [1, 0.5, 0.25][Math.min(seen, 2)] * poi.score;
      const key = [contribution, -travel, -poi.id];
      if (!bestKey || key > bestKey) { best = poi; bestKey = key; bestTravel = travel; }
    }
    if (!best) break;
    chosen.push(best); used.add(best.id);
    counts[best.dominant_domain] = (counts[best.dominant_domain] || 0) + 1;
    remaining -= bestTravel + best.dwell_mins; cur = best;
  }
  // 2-opt: keep a swap only if total time falls.
  let improved = true, rounds = 0;
  while (improved && rounds < 10) {
    improved = false; rounds++;
    for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) {
      const cand = [...chosen]; [cand[i], cand[j]] = [cand[j], cand[i]];
      if (routeTime(cand, start) < routeTime(chosen, start) - 1e-9 && routeTime(cand, start) <= budget) { chosen = cand; improved = true; }
    }
  }
  return chosen;
}
function baseline(start, scored, budget, maxStops) {
  let remaining = budget, cur = start, chosen = [], used = new Set();
  while (chosen.length < maxStops) {
    let best = null, bestTravel = Infinity;
    for (const poi of scored) {
      if (used.has(poi.id)) continue;
      const travel = travelMins(cur, poi);
      if (travel + poi.dwell_mins <= remaining && travel < bestTravel) { best = poi; bestTravel = travel; }
    }
    if (!best) break;
    chosen.push(best); used.add(best.id); remaining -= bestTravel + best.dwell_mins; cur = best;
  }
  return chosen;
}
function withArrivals(start, order) {
  let clock = 0, cur = start;
  return order.map((poi) => {
    const travel = travelMins(cur, poi); clock += travel;
    const stop = { ...poi, travel_mins: travel, arrival_mins: clock, departure_mins: clock + poi.dwell_mins };
    clock += poi.dwell_mins; cur = poi; return stop;
  });
}
function totals(start, order) {
  const stops = withArrivals(start, order);
  const travel = stops.reduce((s, p) => s + p.travel_mins, 0);
  const dwell = stops.reduce((s, p) => s + p.dwell_mins, 0);
  return { total_mins: travel + dwell, travel_mins: travel, dwell_mins: dwell,
    domains_covered: new Set(order.map((p) => p.dominant_domain)).size, route_value: routeValue(order), stops: order.length };
}
function coverage(order) {
  if (!order.length) return DOMAINS.map(() => 0);
  const dwell = order.reduce((s, p) => s + p.dwell_mins, 0) || order.length;
  return DOMAINS.map((d) => order.reduce((s, p) => s + p.dwell_mins * p.vector[d], 0) / dwell);
}

function computePlan() {
  const profile = state.profile.every((v) => v === 0) ? [0.5, 0.5, 0.5, 0.5] : state.profile;
  const withVectors = POIS.map((p) => ({ ...p, vector: p.vectors_by_age[state.ageBand] }));
  const scored = withVectors.map((p) => scorePoi(p, profile, travelMins(state.start, p)))
    .sort((a, b) => b.score - a.score);
  const route = greedy(state.start, scored, state.budget, state.maxStops);
  const base = baseline(state.start, scored, state.budget, state.maxStops);
  return { profile, scored, route: withArrivals(state.start, route), totals: totals(state.start, route),
    baseline: { route: withArrivals(state.start, base), totals: totals(state.start, base) },
    coverage: coverage(route) };
}

function render(plan) {
  // Map markers: filtered view, sized by score, coloured by dominant domain.
  markers.forEach((m) => map.removeLayer(m)); markers.clear();
  const visible = plan.scored.filter((p) =>
    (state.domain === "all" || p.dominant_domain === state.domain) &&
    (state.category === "all" || p.category === state.category));
  document.getElementById("count").textContent =
    `${visible.length} of ${plan.scored.length} places shown · ${plan.scored.length} in dataset`;
  for (const poi of visible) {
    const marker = L.circleMarker([poi.lat, poi.lon], {
      radius: 4 + poi.score * 7, color: COLORS[poi.dominant_domain], weight: 1,
      fillColor: COLORS[poi.dominant_domain], fillOpacity: state.selectedId === poi.id ? 0.95 : 0.55,
    }).addTo(map);
    marker.bindPopup(`<b>${poi.name}</b><br>${poi.category} · ${LABELS[poi.dominant_domain]}<br>Score ${poi.score.toFixed(3)} · ${poi.dwell_mins} min · ${poi.cost}`);
    marker.on("click", () => { state.selectedId = poi.id; render(plan); });
    markers.set(poi.id, marker);
  }
  if (routeLayer) map.removeLayer(routeLayer);
  const stops = plan.route;
  if (stops.length) {
    const latlngs = [[state.start.lat, state.start.lon], ...stops.map((s) => [s.lat, s.lon])];
    routeLayer = L.polyline(latlngs, { color: "#111827", weight: 3 }).addTo(map);
    L.marker([state.start.lat, state.start.lon]).addTo(routeLayer).bindPopup(`<b>Start: ${state.start.label}</b>`);
    stops.forEach((s, i) => L.marker([s.lat, s.lon]).addTo(routeLayer).bindPopup(`<b>Stop ${i + 1}: ${s.name}</b><br>Arrives ${Math.round(s.arrival_mins)} min in`));
  }
  // Ranked list (top 10).
  document.getElementById("ranked").innerHTML = plan.scored.slice(0, 10).map((p) =>
    `<button class="rank-row ${state.selectedId === p.id ? "selected" : ""}" data-id="${p.id}">
      <span>${p.name}</span><span>${p.score.toFixed(3)}</span></button>`).join("");
  document.querySelectorAll(".rank-row").forEach((el) => el.addEventListener("click", () => {
    state.selectedId = Number(el.dataset.id); render(plan);
  }));
  // Fit panel: selected POI (or top-ranked), radar + breakdown.
  const selected = plan.scored.find((p) => p.id === state.selectedId) || plan.scored[0];
  if (selected) {
    document.getElementById("selected-name").textContent = `${selected.name} — ${selected.category}`;
    document.getElementById("breakdown").innerHTML =
      `<div class="bar"><div style="width:${selected.fit_part * 100}%;background:#2563eb"></div></div>
       <p>Fit part ${selected.fit_part.toFixed(3)} (cosine ${selected.fit.toFixed(3)} × 0.70) ·
          Age part ${selected.age_part.toFixed(3)} · Travel penalty −${selected.penalty.toFixed(3)} ·
          <b>Score ${selected.score.toFixed(3)}</b> · Travel ${selected.travel.toFixed(1)} min · ${selected.dwell_mins} min visit</p>`;
    drawRadar(plan.profile, DOMAINS.map((d) => selected.vector[d]), plan.coverage);
  }
  // Timeline + totals + baseline.
  const t = plan.totals, b = plan.baseline.totals;
  document.getElementById("totals").innerHTML =
    `<b>${t.total_mins.toFixed(0)} min total</b> · ${t.travel_mins.toFixed(0)} min travel · ${t.domains_covered} domains · route value ${t.route_value.toFixed(3)}<br>
     Baseline (nearest first): ${b.total_mins.toFixed(0)} min · ${b.domains_covered} domains · route value ${b.route_value.toFixed(3)}`;
  document.getElementById("timeline").innerHTML = plan.route.map((s) =>
    `<div class="tl-travel" style="flex:${Math.max(s.travel_mins, 2)}">travel ${s.travel_mins.toFixed(0)}′</div>
     <div class="tl-stop" style="flex:${s.dwell_mins};background:${COLORS[s.dominant_domain]}" title="${s.name}">${s.name}</div>`).join("")
    || "<p>No place fits this budget. Widen the budget or move the start point.</p>";
}

function drawRadar(profile, poiVector, coverageVector) {
  const svg = d3.select("#radar"); svg.selectAll("*").remove();
  const W = 260, H = 220, cx = W / 2, cy = H / 2 + 8, R = 78;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 4;
  const point = (values, i) => [cx + Math.cos(angle(i)) * R * values[i], cy + Math.sin(angle(i)) * R * values[i]];
  const polygon = (values) => values.map((_, i) => point(values, i).join(",")).join(" ");
  [0.5, 1].forEach((r) => svg.append("polygon").attr("points", DOMAINS.map((_, i) =>
    [cx + Math.cos(angle(i)) * R * r, cy + Math.sin(angle(i)) * R * r].join(",")).join(" "))
    .attr("fill", "none").attr("stroke", "#d1d5db"));
  DOMAINS.forEach((d, i) => {
    svg.append("line").attr("x1", cx).attr("y1", cy).attr("x2", point([1, 1, 1, 1], i)[0]).attr("y2", point([1, 1, 1, 1], i)[1]).attr("stroke", "#e5e7eb");
    svg.append("text").attr("x", cx + Math.cos(angle(i)) * (R + 14)).attr("y", cy + Math.sin(angle(i)) * (R + 14))
      .attr("text-anchor", "middle").attr("font-size", "11").text(LABELS[d]);
  });
  svg.append("polygon").attr("points", polygon(coverageVector)).attr("fill", "#16a34a").attr("fill-opacity", 0.25).attr("stroke", "#16a34a");
  svg.append("polygon").attr("points", polygon(poiVector)).attr("fill", "#2563eb").attr("fill-opacity", 0.25).attr("stroke", "#2563eb");
  svg.append("polygon").attr("points", polygon(profile)).attr("fill", "none").attr("stroke", "#111827").attr("stroke-dasharray", "4 3");
}

function bindControls() {
  DOMAINS.forEach((d, i) => {
    const el = document.getElementById(`slider-${d}`);
    el.addEventListener("input", () => {
      state.profile[i] = Number(el.value);
      document.getElementById(`value-${d}`).textContent = el.value;
      render(computePlan());
    });
  });
  document.getElementById("age").addEventListener("change", (e) => { state.ageBand = e.target.value; render(computePlan()); });
  document.getElementById("start").addEventListener("change", (e) => { state.start = STARTS[Number(e.target.value)]; render(computePlan()); });
  document.getElementById("budget").addEventListener("change", (e) => { state.budget = Number(e.target.value); render(computePlan()); });
  document.getElementById("domain").addEventListener("change", (e) => { state.domain = e.target.value; render(computePlan()); });
  document.getElementById("category").addEventListener("change", (e) => { state.category = e.target.value; render(computePlan()); });
}

async function init() {
  map = L.map("map").setView([34.068, -118.29], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
  const res = await fetch("data/dtla_pois.json");
  POIS = await res.json();
  const categories = [...new Set(POIS.map((p) => p.category))].sort();
  document.getElementById("category").innerHTML = `<option value="all">All types</option>` +
    categories.map((c) => `<option value="${c}">${c.replaceAll("_", " ")} (${POIS.filter((p) => p.category === c).length})</option>`).join("");
  document.getElementById("age").innerHTML = AGE_BANDS.map((b) => `<option value="${b.key}" ${b.key === state.ageBand ? "selected" : ""}>${b.label}</option>`).join("");
  document.getElementById("start").innerHTML = STARTS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("");
  bindControls();
  render(computePlan());
}
init();
