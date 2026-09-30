# BaanGuTuamMai — Implementation Plan

## 1. Project Overview

**Project name:** BaanGuTuamMai  
**Working tagline:** "Is my home at risk of flooding?"

BaanGuTuamMai is a minimalist, location-aware flood-risk web application for Thailand. It combines public hydrological, rainfall, reservoir, gate/drainage, tidal, elevation, and historical flood data to answer one simple question:

> **"Should I be worried about flooding at my home right now?"**

The application must hide most of the underlying data complexity from users. The backend may process dozens of signals, but the main UI should communicate only:

1. Current flood-risk level.
2. The main reasons behind the risk.
3. How the current situation compares with the 2011 Thailand flood.
4. What the user should do next, when appropriate.

This is an **information and risk-estimation product**, not an official flood-warning authority.

---

## 2. Product Principles

### 2.1 Simplicity first

The homepage should be understandable within 5–10 seconds.

Avoid:

- Government-dashboard-style dense layouts.
- Large tables.
- Dozens of cards.
- Excessive charts.
- Technical hydrology terminology.
- Raw API values.
- "AI" branding on every screen.

Prefer:

- One primary risk status.
- Short natural-language explanation.
- One or two supporting indicators.
- One simple historical comparison.
- Progressive disclosure for advanced users.

### 2.2 Complexity belongs in the engine

The backend may eventually use:

- River water levels.
- Water-level trends.
- Rainfall.
- Upstream rainfall.
- Reservoir storage.
- Reservoir inflow/outflow.
- Drainage gate status.
- Pump status.
- Tide / sea-level conditions.
- Elevation.
- Flood extent.
- Historical observations.
- Data freshness.
- Station proximity.
- Travel-time relationships.

The UI should not expose all of these by default.

### 2.3 Never pretend to predict with certainty

Use language such as:

- "Estimated flood risk"
- "Current conditions suggest..."
- "Risk is increasing"
- "Data confidence: high / medium / limited"

Never say:

- "Your house will definitely flood."
- "Your house will definitely not flood."

### 2.4 Explain the result

Every risk result must be explainable.

Example:

> **Moderate risk**
>
> Water levels near your area are rising, and upstream rainfall is above normal. Your estimated ground elevation is still above the current water level.

---

## 3. Target Users

### Primary user

A resident in flood-prone areas of Thailand who wants a quick answer during rainy periods.

Initial geographic focus:

- Nonthaburi.
- Bangkok metropolitan area.
- Lower Chao Phraya basin.

Do not design the data model to be Nonthaburi-specific. The system should eventually support other provinces.

### Secondary users

- Residents monitoring relatives' homes.
- Property owners.
- Small businesses.
- Local communities.
- People considering travel through flood-prone areas.

---

## 4. MVP Scope

### MVP Goal

A user can set a home location and receive a simple current flood-risk assessment.

### MVP must include

#### Location

- Search/select a location on a map.
- Store latitude and longitude.
- Retrieve estimated elevation.
- Allow manual adjustment of home/floor elevation.

#### Water

- Find relevant nearby river/water-level stations.
- Retrieve current water level.
- Retrieve recent water-level history.
- Calculate 6h / 12h / 24h trend.

#### Rainfall

- Retrieve nearby rainfall observations.
- Calculate recent rainfall totals.
- Prefer upstream/basin rainfall where spatial relationships are available.

#### Risk engine

- Calculate a transparent risk score.
- Convert the score to:
  - Green: Low
  - Yellow: Watch
  - Orange: High
  - Red: Severe

#### Historical comparison

- Compare current water conditions with historical observations.
- Build the initial 2011 comparison from verified historical data.
- Clearly distinguish "same station / same metric" from approximate comparisons.

#### Homepage

Show only:

- Location.
- Current risk.
- One-sentence explanation.
- Two or three major contributing factors.
- Distance to estimated critical water level.
- Simple 2011 comparison.
- Last updated time.
- Data confidence.

### MVP explicitly excludes

- Full ML prediction.
- Automated evacuation routing.
- Official emergency alerts.
- Full Thailand flood modeling.
- Real-time satellite flood detection.
- Automatic household-level flood-depth prediction.
- Complex dam-operation causality modeling.
- Social/community reporting.

---

## 5. Suggested Technology Stack

### Frontend

- Next.js
- TypeScript
- React
- Zustand for state management
- Tailwind CSS
- MapLibre GL JS
- TanStack Query
- Zod

### Backend

Start with Next.js server-side API routes if the project remains small.

Recommended architecture:

```text
Next.js
├── UI
├── Server Actions / Route Handlers
├── Data ingestion services
├── Risk engine
└── Historical comparison engine
```

If ingestion workloads grow, extract them into a worker service later.

### Database

**PostgreSQL + PostGIS**

Why:

- Geographic queries.
- Nearest-station calculations.
- River/station geometry.
- Flood polygons.
- Future watershed and flood-zone analysis.

### Caching

Use a cache layer appropriate to the deployment platform.

Cache:

- Current water observations.
- Rainfall observations.
- Reservoir observations.
- Station metadata.

Do not call public government APIs directly from every browser request.

### Deployment

Preferred MVP:

- Vercel for the web application.
- Managed PostgreSQL/PostGIS provider with a free/low-cost tier where practical.
- Scheduled ingestion using a cron-capable service.

Do not make the frontend dependent on the availability or CORS configuration of public APIs.

---

## 6. Data Source Strategy

Do not hard-code a single provider into business logic.

Create a provider abstraction:

```text
DataProvider
├── WaterLevelProvider
├── RainfallProvider
├── ReservoirProvider
├── GateProvider
├── TideProvider
├── ElevationProvider
└── HistoricalFloodProvider
```

Each provider must normalize external data into an internal schema.

### Candidate Thai public sources

The implementation team should verify current API documentation and availability before coding against endpoints.

Potential sources include:

- Hydro-Informatics Institute (HII / ThaiWater).
- Royal Irrigation Department (RID).
- Department of Water Resources (DWR).
- National Water Command Center / ONWR.
- Thai government open-data portal (data.go.th).
- Marine / tide data from relevant Thai government agencies.
- Public DEM/elevation sources.
- Historical flood maps and datasets from Thai government / academic sources.

### Important rule

**Do not invent API endpoints.**

Before implementation:

1. Verify endpoint.
2. Verify authentication requirement.
3. Verify rate limits.
4. Verify update frequency.
5. Verify historical availability.
6. Verify units.
7. Verify datum/reference system.
8. Save the source metadata in the database.

---

## 7. Internal Data Model

### Location

```ts
type UserLocation = {
  id: string;
  latitude: number;
  longitude: number;
  groundElevationM?: number;
  floorElevationM?: number;
  label?: string;
};
```

### Water station

```ts
type WaterStation = {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  river?: string;
  basin?: string;
  datum?: string;
  unit: string;
};
```

### Water observation

```ts
type WaterObservation = {
  stationId: string;
  observedAt: string;
  waterLevelM?: number;
  dischargeM3s?: number;
  quality?: string;
};
```

### Rainfall observation

```ts
type RainObservation = {
  stationId: string;
  observedAt: string;
  rainfallMm?: number;
};
```

### Reservoir observation

```ts
type ReservoirObservation = {
  reservoirId: string;
  observedAt: string;
  storageMcm?: number;
  storagePercent?: number;
  inflowM3s?: number;
  outflowM3s?: number;
};
```

### Gate / pump observation

```ts
type InfrastructureObservation = {
  assetId: string;
  observedAt: string;
  status?: string;
  openingPercent?: number;
  flowM3s?: number;
};
```

### Risk assessment

```ts
type RiskAssessment = {
  locationId: string;
  generatedAt: string;
  level: "low" | "watch" | "high" | "severe";
  score: number;
  confidence: "high" | "medium" | "limited";
  waterLevelRisk: number;
  waterTrendRisk: number;
  rainfallRisk: number;
  upstreamRisk: number;
  infrastructureRisk: number;
  tideRisk: number;
  elevationRisk: number;
  reasons: string[];
  recommendedAction?: string;
};
```

---

## 8. Risk Engine

### 8.1 Initial model

Do NOT start with machine learning.

Use a transparent weighted model.

Initial conceptual weighting:

```text
Current water level       30%
Water-level trend         20%
Rainfall                  15%
Upstream conditions       10%
Elevation relationship    10%
Drainage / infrastructure 10%
Tidal influence            5%
```

These are initial engineering assumptions, not validated scientific coefficients.

The implementation must keep weights configurable.

### 8.2 Risk normalization

Every signal should be normalized to `0..1`.

Example:

```text
0.00 - 0.24  Low
0.25 - 0.49  Watch
0.50 - 0.74  High
0.75 - 1.00  Severe
```

Do not expose the raw score as the primary user-facing concept.

### 8.3 Critical level

Where reliable local thresholds exist, calculate:

```text
distanceToCriticalLevel =
criticalWaterLevel - currentWaterLevel
```

For a home:

```text
distanceToFloor =
floorElevation - estimatedWaterSurfaceElevation
```

Important:

- Do not assume river gauge elevation equals water depth at the user's home.
- Clearly label any derived value as an estimate.
- Do not imply a direct hydraulic model unless one exists.

---

## 9. Data Confidence

Confidence should consider:

```text
Source availability
+ freshness
+ station distance
+ number of independent signals
+ data quality
+ historical comparability
```

Example:

### High

- Nearby water station updated recently.
- Rainfall station updated recently.
- Elevation available.
- Multiple supporting signals available.

### Medium

- Main water station available.
- Some secondary data delayed or missing.

### Limited

- Primary station unavailable.
- Old observations.
- Poor geographic match.

The UI should say:

> **Assessment confidence: Medium**

instead of showing technical error messages.

---

## 10. 2011 Historical Comparison

This is a signature feature.

### Goal

Answer:

> "How does today's situation compare with the major 2011 flood?"

### First implementation

Use verified historical observations from the same or comparable water-level stations.

Calculate:

```text
currentLevel
2011Peak
current / 2011Peak
```

But do not describe this as "64% as dangerous as 2011."

Instead say:

> "The current water level is approximately X m below the 2011 peak at this station."

### Historical timeline

Store:

```text
date
station
waterLevel
rainfall
knownFloodStatus
source
```

This enables future comparison with:

- 2011.
- 2017.
- 2021.
- Other major flood years.

### Future spatial comparison

When verified 2011 flood polygons become available:

- Store them as PostGIS polygons.
- Overlay them on the map.
- Determine whether the user's location falls inside or near the historical extent.

Do not fabricate a 2011 flood polygon from current data.

---

## 11. UI / UX Specification

### Main screen

The main screen must contain:

```text
[Home location]

        🟡

     Watch

"Water levels are rising,
but conditions are still below
the historical critical range."

[2–3 short reasons]

--------------------

Compared with 2011
Current       ●───────
2011          ───────●

"Still below the 2011 peak."

Updated 11:20
Confidence: High

[View details]
```

### Navigation

Only four primary destinations:

```text
Home
Map
History
Settings
```

### Home

The answer.

### Map

Spatial context.

### History

Historical comparison and trends.

### Settings

Location, elevation, notifications, data preferences.

---

## 12. Design System

### Visual direction

Use:

- Minimal.
- Calm.
- Spacious.
- Mobile-first.
- Strong typography.
- Limited color usage.
- Clear risk hierarchy.

Avoid:

- Dense dashboard layouts.
- Too many cards.
- Excessive gradients.
- Excessive animation.
- Giant numbers everywhere.
- Red alert aesthetics when risk is low.

### Risk colors

Use semantic colors only:

- Green = Low.
- Yellow = Watch.
- Orange = High.
- Red = Severe.

Do not use color as the only signal. Always include text.

### Language

The product UI should be Thai-first.

Internal code, database fields, documentation, and developer-facing content should be English.

---

## 13. API Design

Suggested internal endpoints:

```text
GET /api/location/elevation
GET /api/stations/nearby
GET /api/water/current
GET /api/water/history
GET /api/rain/current
GET /api/rain/history
GET /api/reservoirs/summary
GET /api/infrastructure/status
GET /api/tide/current
GET /api/risk
GET /api/history/2011
```

Prefer one aggregated endpoint for the homepage:

```text
GET /api/dashboard?lat=...&lng=...
```

Response:

```json
{
  "location": {},
  "risk": {},
  "water": {},
  "rain": {},
  "historicalComparison": {},
  "confidence": {},
  "updatedAt": ""
}
```

The frontend should not need to orchestrate 8–10 external requests.

---

## 14. Data Ingestion

Implement scheduled jobs:

```text
water-level ingestion
rainfall ingestion
reservoir ingestion
infrastructure ingestion
tide ingestion
historical ingestion
```

Each job should:

1. Fetch external data.
2. Validate response.
3. Normalize units.
4. Normalize timestamps.
5. Store raw response metadata.
6. Store normalized observations.
7. Record source freshness.
8. Record errors without crashing the whole pipeline.

### Data freshness

Every source should have:

```text
lastSuccessfulFetch
lastObservationTime
fetchStatus
errorMessage
```

---

## 15. Caching and Failure Handling

Public APIs can be slow or unavailable.

Never let a single provider outage blank the whole dashboard.

Example:

```text
HII water data       available
Rainfall             available
Reservoir data       delayed
Tide                  unavailable
```

The dashboard should still work.

Display:

> "Some supporting data is delayed. Risk assessment confidence is medium."

Use the most recent valid data within an explicit freshness window.

---

## 16. Testing Strategy

### Unit tests

Test:

- Risk normalization.
- Weight calculations.
- Trend calculation.
- Distance calculations.
- Data freshness.
- Confidence calculation.
- Historical comparison.

### Integration tests

Test:

- Provider → normalization.
- Database persistence.
- Risk engine → API.
- API → dashboard.

### UI tests

Test:

- Location setup.
- Risk status rendering.
- Missing data.
- API failure.
- Mobile layout.
- Historical comparison.

### Important edge cases

- No nearby station.
- Station offline.
- Stale data.
- Extreme rainfall.
- Missing elevation.
- Invalid coordinates.
- Multiple stations with conflicting readings.
- Government API schema changes.

---

## 17. Development Phases

### Phase 0 — Research

Deliverables:

- Verified data-source registry.
- API documentation notes.
- Sample responses.
- Units and timestamps.
- Station metadata.
- Historical 2011 source candidates.

Do not build the risk engine until the actual data formats are verified.

### Phase 1 — Foundation

- Create Next.js project.
- Set up TypeScript.
- Set up Tailwind.
- Set up PostgreSQL/PostGIS.
- Create database schema.
- Add provider abstraction.
- Add basic map.

### Phase 2 — Water + Rainfall MVP

- Water station ingestion.
- Water observation storage.
- Rainfall ingestion.
- Nearby-station selection.
- Trend calculation.
- Basic risk engine.

### Phase 3 — User Location

- Location search.
- Map pin.
- Elevation retrieval.
- Optional floor elevation.
- Save home location locally first.

### Phase 4 — Minimal Dashboard

Implement the main "Should I worry?" screen.

No advanced dashboard.

### Phase 5 — Historical 2011

- Import verified historical data.
- Create comparison service.
- Build simple visual comparison.
- Add historical explanation.

### Phase 6 — Infrastructure + Tide

- Reservoirs.
- Gates.
- Pumps.
- Tide.
- Improve confidence calculation.

### Phase 7 — Map

Add:

- Stations.
- Rivers.
- Infrastructure.
- Historical flood layers.

### Phase 8 — Alerts

Optional:

- Browser notifications.
- LINE integration later.
- Threshold-based alerts.

### Phase 9 — Prediction

Only after enough validated historical data exists.

Possible future technologies:

- Time-series regression.
- Gradient boosting.
- Temporal models.

Do not add ML merely for the sake of saying the product uses AI.

---

## 18. Definition of Done for MVP

MVP is complete when:

- [ ] User can choose a home location.
- [ ] Elevation can be retrieved or manually entered.
- [ ] Nearby water station can be selected automatically.
- [ ] Current water level is displayed internally.
- [ ] Recent trend is calculated.
- [ ] Rainfall data is available.
- [ ] Risk score is calculated deterministically.
- [ ] Risk is displayed as Low / Watch / High / Severe.
- [ ] The system explains the top risk factors.
- [ ] Data freshness is tracked.
- [ ] Data failure does not crash the dashboard.
- [ ] 2011 comparison works for at least one validated station.
- [ ] Mobile UI is clean.
- [ ] No dense technical dashboard appears on the homepage.
- [ ] No unsupported flood guarantee is presented.

---

## 19. Non-Goals

Do not attempt in the first version:

- Full hydrodynamic simulation.
- Nation-wide flood prediction.
- Exact house-level flood depth.
- Emergency dispatch.
- Official government warning replacement.
- Automatic evacuation planning.
- ML forecasting without sufficient historical validation.

---

## 20. Engineering Rules for Claude

1. Do not invent public API endpoints.
2. Do not invent historical flood values.
3. Do not invent thresholds.
4. Do not silently mix different elevation datums.
5. Store units explicitly.
6. Store source and observation timestamps.
7. Keep provider-specific logic outside the risk engine.
8. Keep risk weights configurable.
9. Write tests for every risk calculation.
10. Never expose raw provider failures directly to end users.
11. Prefer graceful degradation.
12. Keep the homepage minimal.
13. Do not add a feature merely because the backend can support it.
14. Every new user-facing metric must answer a real user question.
15. Treat 2011 comparison as historical context, not a direct prediction model.

---

## 21. Suggested Repository Structure

```text
BaanGuTuamMai/
├── app/
│   ├── page.tsx
│   ├── map/
│   ├── history/
│   ├── settings/
│   └── api/
│
├── components/
│   ├── risk/
│   ├── map/
│   ├── history/
│   └── common/
│
├── lib/
│   ├── providers/
│   │   ├── water/
│   │   ├── rainfall/
│   │   ├── reservoir/
│   │   ├── infrastructure/
│   │   ├── tide/
│   │   └── elevation/
│   │
│   ├── risk/
│   ├── historical/
│   ├── geo/
│   ├── data/
│   └── validation/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── seed/
│
├── jobs/
│   ├── water/
│   ├── rainfall/
│   ├── reservoirs/
│   └── infrastructure/
│
├── tests/
│
├── docs/
│   ├── data-sources.md
│   ├── risk-model.md
│   └── historical-2011.md
│
├── SKILL.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 22. First Claude Task

Before writing production code, Claude should:

1. Read this plan and `SKILL.md`.
2. Inspect the repository.
3. Produce a data-source research report.
4. Verify actual Thai public APIs.
5. Record:
   - Source name.
   - URL.
   - Authentication.
   - Update frequency.
   - Historical range.
   - Units.
   - Coordinate system.
   - Example response.
   - Rate limits.
   - License / attribution requirements.
6. Do not implement a provider until the source is verified.
7. Propose the final MVP database schema.
8. Only then begin implementation.

The first implementation milestone should be:

> **A working local prototype that lets a user select a location and see the nearest water station, current water level, recent trend, rainfall, and a simple explainable risk state.**
