# SSRS Reports in PureBread — Design

**Date:** 2026-07-21  
**Status:** Approved (Approach 1); implementation in progress

## Goal

Rebuild the six SSRS reports in Historical Reports (`/data-table`) against `MaterialInfo`, `ConsumptionInfo`, and `PM1Data`, using a separate SQL Server bind from env, without changing KPI/calendar on `BatchMaterials_Shadow`.

## Decisions

| Topic | Choice |
|-------|--------|
| Approach | Thin API + parameterized RDL SQL (`text()`), no ORM for SSRS tables |
| Connection | Bind `ssrs` via `SSRS_DATABASE_URI`; primary URI unchanged |
| UI | Replace existing `/data-table` tabs with the six SSRS reports |
| Time windows | SSRS defaults: BeginDate+7h / EndDate+23h converted local→UTC (Asia/Riyadh) |
| Source of truth | RDL files + `Etl_SSMS_Genric/Reports_Queries.md` |

## Reports

1. CL Temp Graph MinMax — `PM1Data`
2. CL Temp Graph Summary — `PM1Data`
3. Feed Production — `MaterialInfo`
4. Raw Material Consumption — `MaterialInfo` + `ConsumptionInfo`
5. Raw Material Consumption Cumulative — `MaterialInfo` + `ConsumptionInfo`
6. Batch Report — `MaterialInfo` (cascading clients → recipes → batches)

## Architecture

- Blueprint `/api/ssrs/*` uses `db.get_engine(bind_key='ssrs')`
- Multi-value `IN` expanded to bound placeholders
- Frontend: rewrite `Reports.tsx`; add endpoints in `api.ts`
- Missing `SSRS_DATABASE_URI` → 503 on SSRS routes only

## Out of scope

- Migrating KPI/calendar off shadow table
- Pixel-perfect SSRS print layout
