# SSRS Reports Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or implement task-by-task. Steps use checkbox syntax.

**Goal:** Wire six SSRS RDL reports into PureBread Historical Reports via a separate env SSRS DB bind.

**Architecture:** Parameterized RDL SQL on Flask bind `ssrs`; replace `/data-table` UI tabs; KPI/calendar stay on primary URI.

**Tech Stack:** Flask, SQLAlchemy `text()`, React/TS Reports page, axios

---

### Task 1: Config + SSRS blueprint (backend)

**Files:**
- Modify: `NFM-backend/config.py`
- Create: `NFM-backend/routes/ssrs_reports.py`
- Create: `NFM-backend/utils/ssrs_time.py`
- Modify: `NFM-backend/app.py`

- [x] Add `SQLALCHEMY_BINDS['ssrs']` from `SSRS_DATABASE_URI` when set
- [x] Implement time helpers + all `/api/ssrs/*` routes from RDL SQL
- [x] Register blueprint in `app.py`
- [x] Add SSRS endpoint constants
- [x] Replace tabs with six SSRS reports; date + cascading filters; tables/charts
- [x] Import blueprint / app loads without SSRS env
- [x] With env unset, `/api/ssrs/health` returns 503