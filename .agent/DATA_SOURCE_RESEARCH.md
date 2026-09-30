# FloodLens — Data Source Research

Research date: 2026-09-30

## Executive Summary

The initial research confirms that FloodLens is technically feasible without building a proprietary sensor network.

The strongest starting point is the Thai government/open-data ecosystem around:

1. HII / ThaiWater water-level observations.
2. HII / ThaiWater rainfall observations.
3. Royal Irrigation Department reservoir data.
4. ThaiWater Standard APIs and schemas.
5. High-resolution terrain/elevation datasets from HII and related Thai government sources.
6. Historical 2011 water/flood information from RID, HII, GISTDA, and other documented sources.

The most important finding is that **water level and rainfall data are much easier to source reliably than gate-operation and real-time tide data**. Therefore, gate and tide data should initially be treated as optional/contextual signals rather than hard requirements for the MVP.

---

# 1. Priority Matrix

| Signal                       | Source                      | Availability | MVP Priority | Notes                                  |
| ---------------------------- | --------------------------- | -----------: | -----------: | -------------------------------------- |
| River water level            | HII / ThaiWater             |         High |           P0 | Best foundation                        |
| Rainfall                     | HII / DWR / ThaiWater       |         High |           P0 | Strong supporting signal               |
| Elevation / terrain          | HII / government LiDAR/DEM  |  Medium-High |           P0 | Critical for location context          |
| Reservoir status             | RID                         |         High |           P1 | Useful upstream context                |
| Reservoir outflow            | RID / EGAT datasets         |       Medium |           P1 | Need temporal/spatial interpretation   |
| River discharge/runoff       | ThaiWater Standard          |  Medium-High |           P1 | Potentially valuable                   |
| 2011 historical water levels | RID / HII                   |       Medium |           P0 | Signature feature                      |
| 2011 flood extent            | GISTDA / research datasets  |       Medium |           P1 | Strong map feature                     |
| Gate status                  | RID / agency-specific       |      Unclear |           P2 | Verify before integration              |
| Tide                         | Thai agencies               |      Partial |           P2 | More difficult for Chao Phraya use     |
| Weather forecast             | External provider           |         High |           P2 | Useful later, but not required for MVP |
| Satellite flood extent       | GISTDA / satellite products |       Medium |           P3 | Future feature                         |

---

# 2. HII / ThaiWater — Water Level

## Status

**Recommended as the primary MVP source.**

The Thai Government Open Data portal provides HII water-level data.

The dataset contains water-level observations at 10-minute intervals and uses meters referenced to mean sea level (ม.รทก.). The catalog states that data from February 2026 follows the ThaiWater Standard format.

Source:

- data.go.th dataset: Water Level
- Organization: Hydro-Informatics Institute (HII)

The dataset documentation states that missing values may be represented by:

- `-999`
- `999999`
- `9999`
- `-`

These must be normalized to null.

### Important

Do not blindly use every station.

The station metadata must be ingested first.

Required internal station fields:

```text
provider
externalId
name
latitude
longitude
river
basin
measurementType
unit
datum
status
```

### Recommended ingestion

Store raw observations:

```text
station_id
observed_at
water_level_m
quality
provider
fetched_at
```

### Source

https://data.go.th/dataset/water-level

---

# 3. ThaiWater Standard — Rainfall API

ThaiWater Standard documents an API for rainfall:

```text
/Rainfall
```

The standard describes API A001.1 for reading rainfall data.

This is important because it provides a more standardized path than scraping dashboards.

Use the standard documentation to understand:

- request parameters;
- response fields;
- station information;
- time range;
- units.

Do not implement a guessed endpoint.

### Source

https://standard.thaiwater.net/

Relevant documentation:

- ThaiWater Standard rainfall API.

---

# 4. HII Rainfall Dataset

The Thai government open-data catalog also provides HII rainfall data.

It includes:

- hourly accumulated rainfall;
- daily accumulated rainfall;
- unit: millimeters.

This is a good fallback / historical ingestion source.

Source:
https://data.go.th/dataset/hii-rainfall

### Recommendation

For MVP:

```text
Primary:
ThaiWater/HII rainfall

Fallback:
DWR rainfall dataset
```

Do not average all rainfall stations indiscriminately.

Select stations based on:

- distance;
- watershed;
- upstream/downstream relationship;
- data freshness.

---

# 5. Department of Water Resources Rainfall

DWR provides a public rainfall dataset through data.go.th.

The dataset is based on:

- Early Warning System (EWS);
- telemetry monitoring systems.

The metadata identifies the format as JSON and the access level as public.

Source:
https://data.go.th/dataset/rainfall

### Recommendation

Use DWR as a second independent rainfall source.

This is valuable for confidence calculation.

Example:

```text
HII rainfall: 72 mm / 24h
DWR rainfall: 68 mm / 24h

=> independent sources agree
=> confidence increases
```

If sources disagree strongly:

```text
HII: 72 mm
DWR: 15 mm

=> flag inconsistency
=> reduce confidence
```

---

# 6. ThaiWater Standard — Runoff

ThaiWater Standard documents:

```text
/Runoff
```

for runoff observations.

API A002.1 is intended to provide runoff information.

This may eventually be more useful than rainfall alone because runoff is closer to the hydrological response we actually care about.

### Recommendation

Do not make runoff a hard MVP dependency.

Add it as P1.

Potential future model:

```text
rainfall
   ↓
runoff
   ↓
river level
   ↓
local risk
```

This gives FloodLens a better causal chain.

---

# 7. Royal Irrigation Department — Reservoir API

RID provides a documented public reservoir API.

The API documentation exposes fields including:

```text
date
total
region
id
name
owner
capacity
storage
active_storage
dead_storage
volume
percent_storage
inflow
outflow
```

This is excellent for FloodLens.

Source:
https://app.rid.go.th/reservoir/api/document/dam

Example public API forms are documented there.

### Recommended use

Do not simply add reservoir storage percentage to flood risk.

Storage percentage by itself does not mean a location downstream is at higher flood risk.

More useful signals:

```text
outflow
outflow trend
inflow
inflow trend
storage
```

And eventually:

```text
dam
↓
river network
↓
travel time
↓
downstream station
↓
user location
```

---

# 8. RID Reservoir Open Data

The Thai open-data portal also exposes RID reservoir datasets.

Example:

- reservoir condition;
- storage;
- water-use volume.

Source:
https://data.go.th/dataset/rid010

This is useful as:

- validation;
- historical storage;
- backup source;
- metadata source.

---

# 9. EGAT Reservoir Data

The government open-data portal includes EGAT reservoir information describing stored and usable water and reservoir operation reports.

Source:
https://data.go.th/dataset/s_00000008

Potential use:

- major dam monitoring;
- cross-validation;
- historical context.

### Recommendation

Use RID as the first reservoir provider.

Add EGAT as a secondary provider where coverage overlaps.

---

# 10. Terrain / Elevation

This is one of the most important pieces of FloodLens.

The Thai government open-data ecosystem now exposes high-resolution terrain datasets.

HII's terrain dataset describes terrain data generated using:

- LiDAR;
- drone surveys;
- mobile mapping systems.

It references mean sea level and reports high positional accuracy.

Source:
https://data.go.th/dataset/terrain

The dataset provides access to terrain data through HII GIS services.

### Important

Do not assume the DEM value is the actual floor elevation of a house.

FloodLens should distinguish:

```text
terrainElevation
floorElevation
```

The UI can initially say:

> Estimated ground elevation: 1.7 m

and allow the user to manually enter:

> House floor elevation: 2.1 m

### Recommendation

P0:

- terrain elevation.

P1:

- high-resolution LiDAR where coverage exists.

P2:

- user-contributed floor elevation.

---

# 11. Royal Thai Armed Forces LiDAR Index

The government open-data catalog also lists terrain-height LiDAR survey indexes covering the central basin, including approximately 1 m resolution and high vertical accuracy.

This is potentially very useful for the lower Chao Phraya / Nonthaburi focus area.

Source:
https://data.go.th/organization/rtarf

### Recommendation

Investigate this source specifically for:

```text
Nonthaburi
Bang Bua Thong
Bang Yai
Pak Kret
Bang Kruai
Pathum Thani
Bangkok
```

If the coverage is available, it could significantly improve the location-elevation model.

---

# 12. Tide / Sea Level

The research found a Thai government dataset for tide-monitoring stations.

The Department of Mineral Resources dataset includes eight tide-monitoring locations:

- Trat
- Rayong
- Prachuap Khiri Khan
- Chumphon
- Nakhon Si Thammarat
- Ranong
- Phuket
- Satun

Source:
https://data.go.th/dataset/gdpublish-tide-water

### Problem

These stations are mostly coastal and do not directly give us a perfect real-time water-level signal for Nonthaburi.

Therefore:

**Do not use the nearest coastal tide station as a direct flood-level measurement for a Nonthaburi home.**

For the lower Chao Phraya, tidal influence should initially be treated as a contextual factor.

Future research should investigate:

- Marine Department.
- Hydrographic Department / Royal Thai Navy.
- Bangkok river-level/tide observations.
- Chao Phraya river-mouth boundary conditions.

### MVP decision

Tide = P2.

Do not block MVP on tide data.

---

# 13. Gate / Drainage Infrastructure

The initial research did not find a clean, standardized nationwide public real-time API for gate opening percentage/status that should be treated as an MVP dependency.

This is a warning sign.

Gate information is likely fragmented by:

- RID;
- Bangkok Metropolitan Administration;
- local authorities;
- irrigation projects;
- individual telemetry systems.

### Recommendation

Create the architecture now:

```ts
InfrastructureProvider;
```

but do not make the first risk engine depend on it.

Potential future fields:

```text
assetId
name
type
latitude
longitude
river/canal
status
openingPercent
flow
observedAt
source
```

---

# 14. 2011 Flood Data

This is where the project becomes much more interesting.

## HII historical 2011 material

HII maintains a 2011 flood information page documenting the event and its hydrological characteristics.

It states that the Chao Phraya basin experienced historically high water volume in 2011.

Source:
https://tiwrmdev.hii.or.th/current/2011/flood54Eng.html

This should be one of the project's historical reference sources.

---

# 15. RID 2011 Daily Flood Reports

RID has archived 2011 flood situation PDFs.

One example is the 30 September 2011 report.

It contains:

- Chao Phraya basin situation;
- flow values;
- reservoir / diversion information;
- gate information;
- water levels;
- locations including Nakhon Sawan, Ayutthaya, Pathum Thani, Nonthaburi;
- Chao Phraya-related infrastructure.

Source example:
https://water.rid.go.th/flood/flood/day30092011.pdf

### This is extremely valuable.

Instead of only using a generic "2011 flood was bad" dataset, FloodLens can potentially reconstruct a historical timeline from archived daily reports.

Potential future pipeline:

```text
RID PDF archive
      ↓
PDF extraction
      ↓
structured observations
      ↓
historical database
      ↓
current vs 2011 comparison
```

Do not automate extraction until a representative set of PDFs has been inspected.

---

# 16. 2011 Lower Chao Phraya / Nonthaburi Context

Historical reporting confirms severe water conditions in Nonthaburi in October 2011.

A 12 October 2011 report described rapidly rising Chao Phraya water at Nonthaburi Pier and emergency sandbag protection.

This is useful as contextual evidence, but should not be treated as a precise sensor dataset.

Source:
https://www.posttoday.com/politics/115807

### Rule

Use newspaper/archive reports as contextual historical evidence.

Do not use them as primary numerical sensor data when official observations are available.

---

# 17. 2011 Flood Extent

Academic work based on GISTDA remote sensing is particularly valuable.

A study on estimating the 2011 flood area and volume over the Chao Phraya basin explains that GISTDA used:

- SAR satellite imagery;
- optical satellite imagery;
- DEM;
- gauge-station water levels;

to map flooded areas and estimate water volume.

Source:
https://www.tandfonline.com/doi/full/10.1080/2150704X.2012.723833

This provides strong evidence that a spatial 2011 comparison is technically feasible.

### Future feature

Store a 2011 flood polygon layer in PostGIS:

```text
historical_flood_event
    id
    year
    source
    geometry
    acquisition_date
    confidence
```

Then:

```text
user location
      ↓
ST_Contains / ST_Intersects
      ↓
inside historical flood extent?
```

This could eventually produce:

> "Your location was inside / outside the mapped 2011 flood extent."

Only do this when the actual geospatial layer is verified.

---

# 18. 2011 Satellite Research

Another study specifically analyzed the long-duration 2011 flood in the lower Chao Phraya valley using satellite imagery.

It describes:

- extensive flooding;
- monthly flood mapping;
- lower Chao Phraya inundation;
- Bangkok impacts.

Source:
https://www.sciencedirect.com/science/article/pii/S0169555X16301155

This can guide the future historical-map feature.

---

# 19. Critical Scientific Warning

Do not calculate:

```text
current river level - home elevation
```

and call the result:

> "Flood depth."

That would be wrong unless a hydraulic model establishes the relationship between the gauge water level and the water surface at the user's location.

For MVP, use language such as:

> "Estimated elevation margin"

rather than:

> "Expected flood depth."

---

# 20. Recommended MVP Data Architecture

## P0

```text
HII Water Level
       +
HII / ThaiWater Rainfall
       +
Terrain / DEM
       +
User Location
       +
2011 historical station data
       ↓
Explainable Risk Engine
       ↓
Simple Dashboard
```

## P1

```text
RID Reservoir
+
Runoff
+
2011 flood extent
+
Additional independent rainfall source
```

## P2

```text
Gate status
+
Tide
+
Pump status
+
Weather forecast
```

## P3

```text
Satellite near-real-time flood extent
+
Machine learning
+
Hydrodynamic modeling
```

---

# 21. Recommended Initial Risk Model

Do not start with all variables.

Use:

```text
Current water level
Water-level trend
Rainfall
Terrain elevation
Historical 2011 reference
Data confidence
```

Reservoirs can be shown as context first.

This makes the MVP scientifically easier to defend.

---

# 22. Proposed Data Source Registry

Create:

```text
data_sources
```

with:

```text
id
name
organization
category
base_url
endpoint
auth_type
update_frequency
expected_latency
historical_start
format
license
attribution
status
last_verified_at
notes
```

Example:

```text
HII Water Level
organization = HII
category = water_level
format = CSV
interval = 10 minutes
license = CC BY-NC
status = verified
```

---

# 23. Source Verification Levels

Use:

```text
verified
partially_verified
research_only
unverified
deprecated
```

Only `verified` sources should enter production ingestion.

---

# 24. First Research Sprint

Before Claude writes provider code, complete these tasks:

### Task A — HII Water

Verify:

- station metadata download;
- current data path;
- historical data path;
- CSV schema;
- timestamp format;
- station coordinates;
- missing-value behavior.

### Task B — Rainfall

Verify:

- ThaiWater Standard API;
- HII rainfall dataset;
- DWR rainfall API/data.

### Task C — RID

Verify:

- dam API;
- reservoir metadata;
- outflow;
- inflow;
- update frequency.

### Task D — Elevation

Verify:

- HII terrain coverage;
- RTARF LiDAR coverage for Nonthaburi;
- access/download mechanism;
- coordinate system;
- vertical reference.

### Task E — 2011

Find:

- historical water-level observations;
- RID daily PDFs;
- HII historical data;
- GISTDA flood polygons;
- station-level peak values.

### Task F — Tide/Gates

Research only.

Do not block MVP.

---

# 25. Current Recommendation

## Build around this stack:

```text
                    ┌──────────────┐
                    │ HII Water    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ HII/Rainfall │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Elevation    │
                    └──────┬───────┘
                           │
        ┌──────────────────▼──────────────────┐
        │          FloodLens Engine          │
        │                                    │
        │ trend + rainfall + elevation +     │
        │ historical context + confidence    │
        └──────────────────┬─────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Risk Result  │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │ "Should I worry?"       │
              └─────────────────────────┘
```

RID reservoirs, gates, tides, and satellite layers should be plugged in progressively.

---

# 26. Important Product Decision

The first version should **not** claim to predict exact house-level flooding.

Instead:

> **FloodLens estimates the current flood risk around your location using available water, rainfall, terrain, and historical data.**

This wording keeps the product useful without pretending that a simple weighted model is a full hydraulic simulation.

---

# 27. Research Sources

Primary / high-priority:

- HII water level dataset:
  https://data.go.th/dataset/water-level

- HII rainfall dataset:
  https://data.go.th/dataset/hii-rainfall

- DWR rainfall:
  https://data.go.th/dataset/rainfall

- ThaiWater Standard:
  https://standard.thaiwater.net/

- ThaiWater rainfall API documentation:
  https://standard.thaiwater.net/docs/

- RID Dam API:
  https://app.rid.go.th/reservoir/api/document/dam

- RID reservoir open data:
  https://data.go.th/dataset/rid010

- HII terrain:
  https://data.go.th/dataset/terrain

- Tide station dataset:
  https://data.go.th/dataset/gdpublish-tide-water

- HII 2011 flood archive:
  https://tiwrmdev.hii.or.th/current/2011/flood54Eng.html

- RID 2011 flood report archive:
  https://water.rid.go.th/flood/flood/day30092011.pdf

- GISTDA-related 2011 flood research:
  https://www.tandfonline.com/doi/full/10.1080/2150704X.2012.723833

---

# 28. Final Recommendation to Claude

Do not begin by implementing 15 providers.

Start with exactly:

```text
1. HII water level
2. HII/ThaiWater rainfall
3. elevation
4. 2011 historical reference
```

Get those four working end-to-end.

Then add:

```text
5. RID reservoir
6. runoff
7. historical flood polygons
```

Only after the core risk assessment works should the project investigate:

```text
8. gates
9. tide
10. satellite
11. prediction/ML
```

The product should be able to deliver a useful answer even if every P2/P3 source is unavailable.

---

# 29. Source Citations / Notes

This research was based primarily on official Thai government/open-data and technical documentation sources. The 2011 section also uses documented HII/RID historical material and peer-reviewed research.

The research intentionally avoids treating unofficial websites as authoritative numerical data sources.
