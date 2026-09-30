# บ้านกู้ท่วมไหม (BaanGuTuamMai)

> **"บ้านเราเสี่ยงน้ำท่วมไหม?"**

แอปพลิเคชันเว็บประเมินความเสี่ยงน้ำท่วมสำหรับประเทศไทย โดยใช้ข้อมูลระดับน้ำ ปริมาณฝน ภูมิประเทศ และข้อมูลอ่างเก็บน้ำจากแหล่งข้อมูลภาครัฐ

## คุณสมบัติหลัก (MVP)

- 📍 เลือกตำแหน่งบ้านบนแผนที่
- 💧 ระดับน้ำและแนวโน้มจากสถานีใกล้เคียง
- 🌧️ ปริมาณฝนสะสม
- 🏠 ระยะห่างระหว่างระดับน้ำกับพื้นบ้าน (โดยประมาณ)
- 📊 เปรียบเทียบกับเหตุการณ์น้ำท่วมปี 2554
- 🎯 ประเมินความเสี่ยง: ปลอดภัย / เฝ้าระวัง / เสี่ยงสูง / อันตราย

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **State**: Zustand, TanStack Query
- **Map**: MapLibre GL JS
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL + PostGIS (planned)
- **Validation**: Zod

## การรัน (Development)

```bash
npm install
npm run dev
```

เปิดที่ http://localhost:3000

## โครงสร้างโปรเจกต์

```
app/             — Next.js pages (ไทย UI)
  page.tsx       — หน้าหลัก (ความเสี่ยง)
  map/           — แผนที่
  history/       — ประวัติระดับน้ำ
  settings/      — ตั้งค่า

components/
  risk/          — RiskCard, DataCards
  history/       — Historical2011Card
  common/        — BottomNav

lib/
  types/         — Domain types (TypeScript)
  providers/     — Provider interfaces (Water, Rain, Reservoir...)
  risk/          — Risk engine (deterministic weighted model)
  i18n/          — Thai UI strings (th.ts)
  geo/           — Geographic utilities
  validation/    — Zod schemas

docs/
  data-sources.md
  risk-model.md
  historical-2011.md
```

## แหล่งข้อมูล

| ข้อมูล      | แหล่ง                        |
| ----------- | ---------------------------- |
| ระดับน้ำ    | HII / ThaiWater (data.go.th) |
| ปริมาณฝน    | HII / กรมทรัพยากรน้ำ         |
| อ่างเก็บน้ำ | กรมชลประทาน (RID)            |
| ภูมิประเทศ  | HII Terrain / LiDAR          |

## ข้อสำคัญ

แอปนี้ให้การประเมินความเสี่ยงเท่านั้น ไม่ใช่การแจ้งเตือนภัยอย่างเป็นทางการ
กรุณาติดตามประกาศจากหน่วยงานราชการในกรณีฉุกเฉิน

---

_ดู [IMPLEMENTATION_PLAN.md](.agent/IMPLEMENTATION_PLAN.md) และ [DATA_SOURCE_RESEARCH.md](.agent/DATA_SOURCE_RESEARCH.md) สำหรับรายละเอียดทางเทคนิค_
