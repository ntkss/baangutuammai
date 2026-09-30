# BaanGuTuamMai Development Skill

## Purpose

This skill defines how an AI coding agent should design, implement, review, and extend BaanGuTuamMai.

BaanGuTuamMai is a minimalist flood-risk information product for Thailand. Its backend may process complex hydrological data, but its user interface must remain simple and understandable.

The primary product question is:

> **"Should I be worried about flooding at my home right now?"**

---

# 1. Core Principles

## 1.1 User outcome over data volume

Do not expose a metric just because it is available.

Every user-facing metric must answer one of these questions:

- Is my home at risk?
- Why is the risk changing?
- How quickly is the situation changing?
- How does this compare with a known historical event?
- What should I do?

If a metric does not answer one of these questions, keep it out of the primary UI.

## 1.2 Backend complexity, frontend simplicity

The system may combine many sources:

```text
water
rainfall
reservoirs
gates
pumps
tides
elevation
historical floods
```

The homepage should still feel like a simple answer, not a hydrology dashboard.

## 1.3 Never fabricate data

Never:

- invent API endpoints;
- invent API responses;
- invent historical measurements;
- invent flood thresholds;
- invent station metadata;
- invent relationships between dams and downstream locations.

If data cannot be verified, mark it as unknown or unavailable.

## 1.4 Never hide uncertainty

The product is an estimate.

Always maintain:

- source;
- observation time;
- fetch time;
- freshness;
- confidence.

The user should know when an assessment is based on incomplete data.

---

# 2. Research Workflow

Before implementing a new data source:

### Step 1 — Find the official source

Prefer:

1. Thai government agency.
2. Official open-data portal.
3. Official agency API.
4. Reputable public dataset with documented provenance.

Avoid relying on:

- random GitHub repositories;
- scraped dashboards;
- unofficial APIs;
- social-media posts.

### Step 2 — Verify the API

Record:

```text
Provider
Endpoint
HTTP method
Authentication
Parameters
Response format
Update frequency
Historical range
Units
Timezone
Coordinate reference
Rate limits
License
Attribution
```

### Step 3 — Save a real sample response

Keep a small fixture under:

```text
tests/fixtures/
```

Do not use live API calls in unit tests.

### Step 4 — Normalize

Convert provider-specific data into internal domain types.

External format:

```text
provider-specific JSON
        ↓
adapter
        ↓
internal model
```

The risk engine must never know how a provider represents its data.

---

# 3. Provider Architecture

Use interfaces.

Example:

```ts
interface WaterLevelProvider {
  getStations(): Promise<WaterStation[]>;
  getObservations(
    stationId: string,
    from: Date,
    to: Date,
  ): Promise<WaterObservation[]>;
}
```

Provider-specific implementation:

```text
lib/providers/water/hii-provider.ts
```

Do not put HII-specific parsing inside:

```text
lib/risk/
```

The risk engine should consume normalized domain objects.

---

# 4. Data Integrity Rules

Every observation should preserve:

```text
provider
externalId
observedAt
fetchedAt
value
unit
quality
```

Never discard the original observation timestamp.

### Timestamp rules

- Store timestamps in UTC internally where practical.
- Convert to `Asia/Bangkok` only at presentation boundaries.
- Never mix observation time with fetch time.

Example:

```text
observedAt = when the sensor measured the value
fetchedAt  = when BaanGuTuamMai retrieved the value
```

These are not interchangeable.

---

# 5. Units and Datums

Water data can be dangerously misleading if units or reference levels are mixed.

Always store:

- unit;
- vertical datum/reference where applicable;
- source metadata.

For example:

```text
waterLevelM
datum = "provider-defined"
```

Do not assume all `meters` are directly comparable.

Before comparing two stations:

- verify their reference datum;
- verify station meaning;
- verify measurement type.

---

# 6. Geographic Rules

Use PostGIS for geographic operations.

Important operations:

- nearest station;
- distance to station;
- station selection;
- point-in-polygon;
- historical flood extent;
- future watershed relationships.

Do not use naive latitude/longitude arithmetic for production distance calculations.

Use geographic functions such as:

```sql
ST_DWithin
ST_Distance
ST_Contains
ST_Intersects
```

where appropriate.

---

# 7. Station Selection

Do not simply select the geographically closest station.

A station-selection strategy should consider:

```text
distance
+
river relationship
+
basin
+
station quality
+
freshness
+
historical relevance
```

MVP can start with:

1. Find nearby valid stations.
2. Filter stale/offline stations.
3. Prefer stations on the same relevant water system.
4. Select the best candidate.
5. Store why the station was selected.

---

# 8. Risk Engine Rules

## 8.1 Deterministic first

The initial risk engine must be deterministic and explainable.

Do not use ML in MVP.

Conceptually:

```ts
riskScore =
  waterLevelRisk * 0.3 +
  waterTrendRisk * 0.2 +
  rainfallRisk * 0.15 +
  upstreamRisk * 0.1 +
  elevationRisk * 0.1 +
  infrastructureRisk * 0.1 +
  tideRisk * 0.05;
```

Weights must be configuration, not hard-coded throughout the application.

## 8.2 No false precision

Do not display:

```text
Risk = 67.38291
```

Internally, a numerical score is acceptable.

Externally, show:

```text
Low
Watch
High
Severe
```

## 8.3 Thresholds must be sourced

If a threshold comes from:

- government warning level;
- station flood stage;
- historical observed level;
- engineering documentation;

store its source.

Do not create a threshold and present it as an official safety threshold.

---

# 9. Trend Calculation

At minimum support:

```text
6-hour change
12-hour change
24-hour change
```

Also calculate rate where data quality allows:

```text
meters/hour
```

Use robust methods when data is noisy.

Possible approach:

```text
recent median
vs
previous-window median
```

rather than blindly using two individual samples.

Handle missing observations.

---

# 10. Rainfall Rules

Rainfall should not be treated as a direct flood-depth measurement.

Separate:

```text
local rainfall
upstream rainfall
basin rainfall
```

Potential windows:

```text
1h
6h
24h
72h
```

Future versions may weight upstream rainfall according to basin and travel time.

Do not claim:

> "50 mm rainfall means 20 cm of flood."

unless a validated model supports it.

---

# 11. Reservoir Rules

Reservoir information is contextual.

Do not implement:

```text
dam discharge ↑ => house flood risk ↑
```

as a universal direct relationship.

Instead consider:

```text
reservoir outflow
+
downstream river conditions
+
location
+
time lag
+
other inflows
```

For MVP, reservoir data may be displayed as a supporting factor rather than a direct causal input.

---

# 12. Tide Rules

For lower Chao Phraya locations, tide and downstream boundary conditions can matter.

Do not simply compare:

```text
sea level > house elevation
```

That is physically meaningless for most inland locations.

Use tide/sea-level information as a contextual downstream condition unless a validated hydraulic relationship exists.

---

# 13. Elevation Rules

Elevation is important but must be treated carefully.

Possible values:

```text
ground elevation
building/floor elevation
river water level
```

These are not automatically interchangeable.

The system should distinguish:

```text
groundElevationM
floorElevationM
```

If floor elevation is unknown, say:

> "Using estimated ground elevation."

Do not pretend DEM elevation equals actual household floor elevation.

---

# 14. Historical 2011 Rules

2011 is a historical benchmark, not a predictive model.

Allowed:

> "Current station level is 0.7 m below its 2011 peak."

Not allowed:

> "Current risk is 30% of 2011 flood risk."

unless a scientifically validated model supports that statement.

Historical comparison must preserve:

```text
station
metric
date
source
datum
```

Only compare like with like.

---

# 15. UI Rules

## Primary screen

The first screen should answer:

```text
Where?
What is the risk?
Why?
What should I do?
How does it compare with 2011?
```

Do not show all raw measurements.

### Good

```text
🟡 Watch

Water levels are rising,
but remain below the historical
critical range.

• Water rising
• Heavy upstream rainfall
• Home elevation still provides margin
```

### Bad

```text
Water Level: 2.1837 m MSL
Rainfall: 42.7812 mm
Dam Storage: 73.281%
Outflow: 127.293 m3/s
Gate: 42.2%
Tide: 1.3281 m
```

The raw data can exist in a details screen.

---

# 16. Progressive Disclosure

Use three information layers.

### Layer 1 — Simple

For everyone:

```text
Risk
Reason
Action
2011 comparison
```

### Layer 2 — Details

For interested users:

```text
water level
trend
rainfall
station
freshness
confidence
```

### Layer 3 — Technical

For developers/research users:

```text
provider
raw observations
normalization
threshold source
model weights
data quality
```

---

# 17. Error Handling

Never expose raw provider errors.

Bad:

```text
HTTP 502 from DWR endpoint
```

Good:

> "Some supporting data is temporarily unavailable."

And lower confidence:

```text
Confidence: Limited
```

The main dashboard should continue operating if possible.

---

# 18. Data Freshness

Every source should define a freshness policy.

Example:

```ts
type FreshnessStatus = "fresh" | "aging" | "stale" | "unavailable";
```

Do not treat old data as current.

Example:

```text
Observation: 08:00
Current time: 12:00
```

If the provider normally updates every 10 minutes, this is stale.

---

# 19. Security and Reliability

- Never expose provider credentials to the browser.
- Keep API keys server-side.
- Validate all external API responses.
- Use schema validation with Zod or equivalent.
- Rate-limit public application endpoints if necessary.
- Cache external requests.
- Protect scheduled ingestion jobs.
- Log provider failures.
- Do not log sensitive user location data unnecessarily.

---

# 20. Testing Rules

Every data provider must have:

- fixture tests;
- malformed-response tests;
- missing-field tests;
- unit conversion tests.

Every risk calculation must have:

- normal case;
- boundary case;
- missing-data case;
- extreme-data case.

Example:

```text
score = 0.249 → Low
score = 0.250 → Watch
score = 0.499 → Watch
score = 0.500 → High
```

Use explicit tests for boundary behavior.

---

# 21. Coding Style

Prefer:

- small functions;
- typed domain objects;
- pure calculation functions;
- dependency injection for providers;
- configuration over magic numbers;
- descriptive variable names.
- Readable codebase for humans.

Avoid:

- giant service classes;
- hidden global state;
- provider calls inside React components;
- business logic inside UI components;
- hard-coded thresholds scattered throughout the codebase.

---

# 22. Documentation Rules

When adding a new data source, update:

```text
docs/data-sources.md
```

When changing risk logic, update:

```text
docs/risk-model.md
```

When adding historical datasets, update:

```text
docs/historical-2011.md
```

Every important model decision should be documented.

---

# 23. Git / Commit Guidance

Prefer small, meaningful commits:

```text
feat: add water station provider abstraction
feat: ingest water observations
feat: add rainfall normalization
feat: implement initial risk engine
feat: add 2011 comparison
fix: handle stale water observations
test: add risk boundary cases
```

Avoid commits such as:

```text
update
fix stuff
changes
final final
```

---

# 24. Claude Execution Protocol

When Claude receives a task:

### First

Read:

- `IMPLEMENTATION_PLAN.md`
- `SKILL.md`
- existing `README.md`
- existing architecture/code

### Then

Determine:

1. What already exists.
2. What the task changes.
3. What data sources are required.
4. Whether a source must be verified first.

### Before coding external integrations

Research and verify the actual provider.

Do not guess.

### Before changing the risk engine

Explain:

- input;
- transformation;
- threshold;
- weighting;
- expected output;
- test cases.

### After implementation

Run:

- typecheck;
- lint;
- unit tests;
- integration tests where available;
- build.

Report failures honestly.

---

# 25. Product Quality Gate

Before considering a feature complete, ask:

### User

> Does this make the answer to "Should I worry?" clearer?

### Data

> Can every number be traced to a source and timestamp?

### Science

> Are we making a stronger claim than the data supports?

### UX

> Did this feature make the homepage more cluttered?

### Reliability

> What happens when this data source goes down?

### Maintainability

> Can another developer understand why this calculation exists?

If any answer is bad, do not ship the feature yet.

---

# 26. Golden Rule

> **BaanGuTuamMai should do the complicated thinking so the user does not have to.**

The product is successful when a person opens it during heavy rain, looks at the screen for a few seconds, and immediately understands:

**"Am I in trouble, why, and what should I do?"**
