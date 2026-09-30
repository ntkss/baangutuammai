# BaanGuTuamMai — Data Sources

แหล่งข้อมูลที่ใช้ในระบบ สถานะการตรวจสอบ และนโยบายการใช้งาน

---

## สถานะ Source Verification

| รหัส                 | ชื่อ                   | หน่วยงาน | ประเภท      | สถานะ              |
| -------------------- | ---------------------- | -------- | ----------- | ------------------ |
| `hii-water-level`    | HII Water Level        | HII      | water_level | partially_verified |
| `hii-rainfall`       | HII Rainfall           | HII      | rainfall    | partially_verified |
| `dwr-rainfall`       | DWR Rainfall (EWS)     | DWR      | rainfall    | partially_verified |
| `rid-reservoir`      | RID Reservoir API      | RID      | reservoir   | partially_verified |
| `hii-terrain`        | HII Terrain/DEM        | HII      | elevation   | research_only      |
| `thaiwater-standard` | ThaiWater Standard API | HII      | water_level | research_only      |

---

## P0 Sources (MVP Critical)

### HII Water Level

- **URL**: https://data.go.th/dataset/water-level
- **Format**: CSV (ThaiWater Standard, from Feb 2026)
- **Interval**: 10 minutes
- **Datum**: ม.รทก. (Mean Sea Level)
- **Missing value codes**: `-999`, `999999`, `9999`, `-`
- **License**: CC BY-NC
- **Attribution**: สถาบันสารสนเทศทรัพยากรน้ำ (HII)
- **Action required**: Download station metadata, verify CSV column schema before building ingestion job

### HII Rainfall

- **URL**: https://data.go.th/dataset/hii-rainfall
- **Format**: CSV/JSON
- **Content**: Hourly and daily accumulated rainfall (mm)
- **License**: CC BY-NC
- **Action required**: Verify update frequency and column mapping

### ThaiWater Standard API

- **URL**: https://standard.thaiwater.net/
- **API**: A001.1 (water level), A002.1 (runoff)
- **Auth**: TBD — verify before implementation
- **Action required**: Register/verify endpoint, save sample response to `tests/fixtures/`

### HII Terrain / DEM

- **URL**: https://data.go.th/dataset/terrain
- **Method**: LiDAR, drone, mobile mapping
- **Reference**: Mean sea level (MSL)
- **Action required**: Verify GIS service access method, coverage for Nonthaburi/Bangkok

---

## P1 Sources

### RID Reservoir API

- **URL**: https://app.rid.go.th/reservoir/api/document/dam
- **Fields**: `date`, `total`, `id`, `name`, `owner`, `capacity`, `storage`, `active_storage`, `dead_storage`, `volume`, `percent_storage`, `inflow`, `outflow`
- **Auth**: TBD
- **Note**: Do NOT map storage% directly to flood risk. Use outflow trend as primary signal.

### DWR Rainfall (EWS)

- **URL**: https://data.go.th/dataset/rainfall
- **Format**: JSON
- **Use**: Secondary independent rainfall source for confidence cross-check

---

## P2 Sources (Not MVP)

### Tide / Sea Level

- **URL**: https://data.go.th/dataset/gdpublish-tide-water
- **Stations**: 8 coastal stations — none directly at Nonthaburi
- **Decision**: P2. Use as contextual downstream factor only. Do not use as primary flood measurement.
- **Future research**: Marine Department, Hydrographic Department / Royal Thai Navy

### Gate / Drainage Infrastructure

- **Status**: No unified public API found
- **Fragmented across**: RID, BMA, local authorities
- **Decision**: Architecture placeholder (`InfrastructureProvider`) ready. Do not block MVP.

---

## Rules for Adding New Sources

1. Find official Thai government or open-data source
2. Verify endpoint actually exists (don't invent)
3. Record: auth, rate limits, format, update frequency, units, timezone, datum
4. Save sample response to `tests/fixtures/<source-id>/`
5. Set `status = 'partially_verified'` until sample matches documented schema
6. Set `status = 'verified'` only after ingestion is tested end-to-end
7. Add entry to `data_sources` table
8. Update this file

---

## Missing Value Handling

All providers may return placeholder values for missing data. Normalize to `null` before storing.

| Provider | Missing value codes           |
| -------- | ----------------------------- |
| HII      | `-999`, `999999`, `9999`, `-` |
| RID      | TBD                           |
| DWR      | TBD                           |
