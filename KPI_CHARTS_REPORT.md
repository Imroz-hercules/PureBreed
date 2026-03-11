# KPI Overview & KPI Dashboard - Comprehensive Report

## Executive Summary

This report provides a complete analysis of all charts in both **KPI Overview** and **KPI Dashboard** pages, including their data sources, real-time status, filters, and database columns used.

---

## 1. KPI OVERVIEW DASHBOARD

### 1.1 Data Source & Real-Time Status

**Status:** ✅ **USING REAL-TIME DATA FROM DATABASE**

- **API Endpoint:** `/api/kpi/dashboard-analytics`
- **Method:** GET
- **Real-Time Updates:** Yes (60-second interval when `isRealTime` is enabled)
- **Default Date Range:** Last 7 days (configurable via date picker)
- **Data Source:** `KPIMaterial` table from database

### 1.2 Filters Applied

**Available Filters:**
- `startDate` (ISO string) - Required
- `endDate` (ISO string) - Required
- `batch` (array) - Optional, multiple batch names
- `product` (array) - Optional, multiple product names
- `material` (array) - Optional, multiple material names

**Backend Processing:**
- 4-hour offset applied to `startDate` only (for 24-hour period queries)
- Filters applied to `KPIMaterial` query:
  - `batch_act_start >= start_date AND batch_act_start <= end_date`
  - `batch_name IN (batch_filters)` if provided
  - `product_name IN (product_filters)` if provided
  - `material_name IN (material_filters)` if provided
  - Excludes records where `product_name = 'not selected'`

### 1.3 Database Columns Used

**Primary Table:** `KPIMaterial`

**Columns Referenced:**
- `batch_guid` - Unique batch identifier
- `batch_name` - Batch name for filtering
- `product_name` - Product name for filtering
- `material_name` - Material name for filtering
- `batch_act_start` - Batch actual start time (primary date filter)
- `batch_act_end` - Batch actual end time
- `batch_transfer_time` - Batch transfer time
- `quantity` - Material quantity
- `actual_value_float` - Actual value (used as energy/efficiency proxy)
- `setpoint_float` - Setpoint value (target value)
- `formula_category_name` - Formula category for delay analysis

### 1.4 KPI Summary Cards (Top Row - 5 Cards)

| Card | Data Source | Calculation | Database Columns |
|------|-------------|--------------|------------------|
| **Production** | API Summary | `totalProduction / 24` (units/hr) | `quantity` (summed per batch) |
| **Management** | API Charts | `oeeComponents.Availability.value` (%) | `batch_act_start`, `batch_act_end` (availability calculation) |
| **OEE** | API Charts | `oeeValue` (%) | `availability`, `performance`, `quality` (calculated) |
| **Energy** | API Summary | `efficiency` (kWh/unit) | `actual_value_float`, `quantity` (efficiency calculation) |
| **Costing** | Hardcoded | `12.5` ($) | N/A (static value) |

**Note:** Trend percentages are calculated client-side as comparison to previous period (95-98% of current value).

### 1.5 Chart Details - Column 1 (Left Column)

#### 1.5.1 Production KPIs (Area Chart)
- **Chart Type:** Area Chart
- **Data Source:** `charts.productionTrend`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (grouped by date)
  - `quantity` (summed per batch per day)
- **Calculation:** Daily production totals from last 30 days
- **Display:** `{date, value}` where value = total quantity per day

#### 1.5.2 Downtime Duration (Area Chart)
- **Chart Type:** Area Chart
- **Data Source:** `charts.downtimeTrend`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `batch_act_end`
  - `batch_transfer_time`
- **Calculation:** 
  - Idle time = `(batch_transfer_time - batch_act_end)` in seconds
  - Converted to hours, grouped by date
  - Last 14 days only
- **Display:** `{date, duration}` where duration = hours of downtime

#### 1.5.3 OEE Components (3D Pie Chart Infographic)
- **Chart Type:** Custom 3D Pie Chart (SVG)
- **Data Source:** `charts.oeeComponents`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start`, `batch_act_end` (for availability)
  - `actual_value_float`, `setpoint_float` (for performance)
  - `setpoint_float`, `actual_value_float` (for quality - tolerance check)
- **Calculation:**
  - **Availability:** `(total_production_hours / planned_hours) × 100`
  - **Performance:** `(total_actual / total_setpoint) × 100`
  - **Quality:** `(materials_within_tolerance / total_materials) × 100`
- **Display:** 3 segments with labels and info boxes

#### 1.5.4 OEE Overview (Circular Gauge)
- **Chart Type:** Radial Bar Chart
- **Data Source:** `charts.oeeValue`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:** Same as OEE Components
- **Calculation:** `(Availability × Performance × Quality) / 10000`
- **Display:** Circular gauge with percentage in center

### 1.6 Chart Details - Column 2 (Middle Column)

#### 1.6.1 Cost Distribution (Pie Chart)
- **Chart Type:** Pie Chart
- **Data Source:** `charts.costDistribution`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `material_name`
  - `actual_value_float` (summed per material)
- **Calculation:** Top 10 materials by `actual_value_float` usage, with "Others" category
- **Display:** `{name, value}` where value = total actual_value_float per material

#### 1.6.2 Energy Efficiency (Power Factor Gauge)
- **Chart Type:** Custom Semi-Circular Gauge (SVG)
- **Data Source:** `charts.powerFactor`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `quantity` (for power factor calculation)
- **Calculation:** 
  - Average quantity normalized to 0-1 range (max ~10000)
  - `power_factor = min(avg_quantity / 10000, 1.0)`
  - Default: 0.92 if no data
- **Display:** Semi-circular gauge with needle, scale marks, and value below

#### 1.6.3 KPI Performance (Radar Chart)
- **Chart Type:** Radar Chart (6 dimensions)
- **Data Source:** `charts.radarKPIs`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `actual_value_float`, `setpoint_float` (for variance/cost control)
  - `quantity` (for energy calculation)
  - `batch_act_start` (for batch completion rate)
- **Calculation:**
  - **Production:** Performance value
  - **Quality:** Quality value
  - **Efficiency:** Availability value
  - **Cost Control:** `100 - avg_variance` (from actual vs setpoint)
  - **Energy:** `(avg_quantity / 10000) × 100`
  - **Management:** Batch completion rate
- **Display:** 6-point radar chart with values 0-100

#### 1.6.4 Cost Breakdown (Bar Chart - Cylindrical)
- **Chart Type:** Bar Chart with 3D cylindrical effect
- **Data Source:** `charts.costBreakdown`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `material_name`
  - `actual_value_float` (summed per material)
- **Calculation:** Top 10 materials by `actual_value_float` usage
- **Display:** `{name, value}` with cylindrical gradient bars

#### 1.6.5 Energy Consumption (24hr) (Line Chart)
- **Chart Type:** Line Chart
- **Data Source:** `charts.energyConsumption`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (hour extracted)
  - `quantity` (normalized to consumption proxy)
- **Calculation:** 
  - Grouped by hour (00:00 to 23:00)
  - `consumption = quantity / 1000` (normalized)
  - All 24 hours filled (0 if no data)
- **Display:** `{hour, consumption}` for 24-hour pattern

#### 1.6.6 Management KPIs (Composed Chart)
- **Chart Type:** Composed Chart (Area + Bar + Line)
- **Data Source:** `charts.plannedVsActual`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `setpoint_float` (planned)
  - `actual_value_float` (actual)
- **Calculation:** 
  - Daily totals of planned (setpoint) vs actual (actual_value_float)
  - Last 7 days only
- **Display:** `{date, planned, actual}`

### 1.7 Chart Details - Column 3 (Right Column)

#### 1.7.1 Delay Analysis (Bar Chart)
- **Chart Type:** Vertical Bar Chart with percentage badges
- **Data Source:** `charts.delayAnalysis`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_guid` (to avoid duplicate counting)
  - `batch_act_end`
  - `batch_transfer_time`
  - `formula_category_name` (for category grouping)
- **Calculation:**
  - Delay = `(batch_transfer_time - batch_act_end)` in minutes
  - Only delays > 5 minutes counted
  - Grouped by `formula_category_name`
  - Count and duration per category
- **Display:** `{category, duration, count}` sorted by duration descending

#### 1.7.2 Shift Efficiency (Doughnut + Circular Gauges)
- **Chart Type:** Doughnut Chart + 3 Circular Progress Gauges
- **Data Source:** `charts.shiftEfficiency`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (hour extracted for shift assignment)
  - `setpoint_float` (planned)
  - `actual_value_float` (actual)
- **Calculation:**
  - **Shift A:** 6:00-14:00
  - **Shift B:** 14:00-22:00
  - **Shift C:** 22:00-6:00
  - Efficiency = `(actual / planned) × 100` per shift
- **Display:** 
  - Doughnut: `{name, value, efficiency}` where value = efficiency × 500
  - Gauges: 3 circular progress gauges with efficiency percentages

#### 1.7.3 Peak Load Hours (Area Chart)
- **Chart Type:** Area Chart
- **Data Source:** `charts.peakLoadHours`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (hour extracted)
  - `quantity` (normalized to load proxy)
- **Calculation:**
  - Grouped by hour (00:00 to 23:00)
  - `load = quantity / 100` (normalized)
  - All 24 hours filled (0 if no data)
- **Display:** `{hour, load}` for 24-hour load pattern

#### 1.7.4 Efficiency Trend (Line Chart)
- **Chart Type:** Line Chart
- **Data Source:** `charts.efficiencyTrend`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `actual_value_float` (energy proxy)
  - `quantity` (converted to tons)
- **Calculation:**
  - Daily efficiency = `energy_sum / quantity_sum` (energy per ton)
  - `energy_sum` = sum of `actual_value_float`
  - `quantity_sum` = sum of `quantity / 1000` (tons)
  - Last 14 days only
- **Display:** `{date, efficiency}` where efficiency = energy per ton

#### 1.7.5 Cost Variance Trend (Area Chart)
- **Chart Type:** Area Chart (linear type with sharp points)
- **Data Source:** `charts.costVarianceTrend`
- **Real-Time:** ✅ Yes
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `setpoint_float`
  - `actual_value_float`
- **Calculation:**
  - Daily variance = `((actual - setpoint) / setpoint) × 100`
  - Average variance per day
  - Last 14 days only
- **Display:** `{date, variance}` where variance = percentage difference

---

## 2. KPI DASHBOARD

### 2.1 Data Source & Real-Time Status

**Status:** ✅ **USING REAL-TIME DATA FROM DATABASE** (Historical) + ✅ **LIVE STREAMING DATA** (PLC)

- **Historical Data API:** `/api/kpi`
- **Live Data API:** 
  - `/api/db4/live/read` (DB4 - Pellet data)
  - `/api/db3/live/read` (DB3 - Mill data)
- **Method:** GET (historical), WebSocket/Streaming (live)
- **Real-Time Updates:** 
  - Historical: Manual refresh via "Apply Filters" button
  - Live: 5-second polling interval when streaming is active
  - PLC Trend: 10-second interval updates when streaming

### 2.2 Filters Applied

**Available Filters:**
- `startDate` (datetime-local) - Required, default: 7 days ago at 7 AM
- `endDate` (datetime-local) - Required, default: Today at 7 AM
- `product` (multi-select array) - Optional
- `batch` (multi-select array) - Optional
- `material` (multi-select array) - Optional

**Backend Processing:**
- 4-hour offset applied to both start and end dates for API calls
- Additional query parameters:
  - `strictDateFilter=true`
  - `page=all`
  - `limit=none`

### 2.3 Database Columns Used

**Primary Table:** `KPIMaterial`

**Columns Referenced:**
- `batch_guid` - Unique batch identifier
- `batch_name` - Batch name for filtering
- `product_name` - Product name for filtering
- `material_name` - Material name for filtering
- `batch_act_start` - Batch actual start time (primary date filter)
- `actual_value_float` - Actual value (used for material weight calculations)
- `setpoint_float` - Setpoint value (target value)
- `quantity` - Material quantity

### 2.4 KPI Summary Cards (Top Row - 5 Cards)

| Card | Data Source | Calculation | Database Columns |
|------|-------------|--------------|------------------|
| **Total Batches** | API Data | Count of unique `batch_guid` | `batch_guid` |
| **Total Materials** | API Data | Count of total records | All records |
| **Unique Products** | API Data | Count of unique `product_name` | `product_name` |
| **Avg Batches/Product** | API Data | `total_batches / unique_products` | `batch_guid`, `product_name` |
| **Latest Batch Date** | API Data | Most recent `batch_act_start` | `batch_act_start` |

### 2.5 Chart Details - KPI Tab

#### 2.5.1 Material Weight per Day (Bar Chart)
- **Chart Type:** Bar Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `actual_value_float` (material weight in kg)
- **Calculation:**
  - Daily material weight = sum of `actual_value_float / 1000` (convert kg to tons)
  - Grouped by date within selected range
- **Display:** `{labels: dates[], values: tons[]}`

#### 2.5.2 Products by Count (Pie Chart)
- **Chart Type:** Pie Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `product_name`
- **Calculation:** Count of records per `product_name`
- **Display:** `{labels: product_names[], values: counts[]}`

#### 2.5.3 No. Batches by Weekday (Bar Chart)
- **Chart Type:** Bar Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for weekday extraction)
  - `batch_guid` (for unique batch counting)
- **Calculation:**
  - Extract weekday from `batch_act_start`
  - Count unique `batch_guid` per weekday
- **Display:** `{labels: weekdays[], values: batch_counts[]}`

#### 2.5.4 Throughput Trend (Line Chart)
- **Chart Type:** Line Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `batch_act_start` (for date grouping)
  - `batch_guid` (for unique batch counting)
- **Calculation:**
  - Count unique batches per day
  - Timeline shows batch count per date
- **Display:** `{labels: dates[], values: batch_counts[]}`

#### 2.5.5 Efficiency vs Complexity (Bar Chart)
- **Chart Type:** Bar Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `product_name`
  - `material_name`
- **Calculation:**
  - Count unique materials per product
  - Complexity = number of unique materials used per product
- **Display:** `{labels: products[], values: unique_material_counts[]}`

#### 2.5.6 Error Percentage (Bar Chart)
- **Chart Type:** Bar Chart
- **Data Source:** Calculated from API data
- **Real-Time:** ✅ Yes (on filter apply)
- **Filters:** Date range, batch, product, material
- **Database Columns:**
  - `material_name`
  - `setpoint_float`
  - `actual_value_float`
- **Calculation:**
  - Error % = `abs((actual - setpoint) / setpoint) × 100` per material
  - Only materials with >5% error shown
- **Display:** `{labels: material_names[], values: error_percentages[]}`

### 2.6 Chart Details - PLC Live Data Tab

#### 2.6.1 PLC Live Data Trend (Line Chart)
- **Chart Type:** Line Chart
- **Data Source:** Live streaming data
- **Real-Time:** ✅ Yes (10-second interval updates)
- **Filters:** None (live data only)
- **Data Sources:**
  - **DB4 (Pellet Data):** `pellet1_ton_hr`, `pellet2_ton_hr`, `pellet3_ton_hr`, `pellet1_temp`, `pellet2_temp`, `pellet3_temp`
  - **DB3 (Mill Data):** `hammermill_amp`, `rollermill_amp`
- **Calculation:**
  - Average of all current values for trend line
  - Individual metrics in detailed chart
  - Data points added at 10-second intervals
  - Keeps last 20 data points
- **Display:** `{labels: timestamps[], values: average_values[]}`

#### 2.6.2 PLC Detailed Data (Multi-Line Chart)
- **Chart Type:** Multi-Line Chart
- **Data Source:** Live streaming data
- **Real-Time:** ✅ Yes (10-second interval updates)
- **Filters:** Toggle visibility for Temperature, Throughput, Amps
- **Data Sources:**
  - **Throughput:** `pellet1_ton_hr`, `pellet2_ton_hr`, `pellet3_ton_hr`
  - **Temperature:** `pellet1_temp`, `pellet2_temp`, `pellet3_temp`
  - **Amps:** `hammermill_amp`, `rollermill_amp`
- **Display:** `{labels: timestamps[], datasets: [{name, values, color, visible}]}`

#### 2.6.3 Throughput Trend (Line Chart - Filtered)
- **Chart Type:** Line Chart (filtered from PLC Detailed Data)
- **Data Source:** Live streaming data
- **Real-Time:** ✅ Yes
- **Filters:** Shows only TonHr metrics
- **Data Sources:** `pellet1_ton_hr`, `pellet2_ton_hr`, `pellet3_ton_hr`

#### 2.6.4 Temperature Trend (Line Chart - Filtered)
- **Chart Type:** Line Chart (filtered from PLC Detailed Data)
- **Data Source:** Live streaming data
- **Real-Time:** ✅ Yes
- **Filters:** Shows only Temp metrics
- **Data Sources:** `pellet1_temp`, `pellet2_temp`, `pellet3_temp`

#### 2.6.5 Amps Trend (Line Chart - Filtered)
- **Chart Type:** Line Chart (filtered from PLC Detailed Data)
- **Data Source:** Live streaming data
- **Real-Time:** ✅ Yes
- **Filters:** Shows only Amp metrics
- **Data Sources:** `hammermill_amp`, `rollermill_amp`

---

## 3. SUMMARY TABLE

### 3.1 KPI Overview - All Charts

| Chart Name | Chart Type | Real-Time | API Endpoint | Filters | Key Database Columns |
|------------|------------|-----------|--------------|---------|---------------------|
| Production KPIs | Area Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `quantity` |
| Downtime Duration | Area Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `batch_act_end`, `batch_transfer_time` |
| OEE Components | 3D Pie Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `batch_act_end`, `actual_value_float`, `setpoint_float` |
| OEE Overview | Radial Bar | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | Same as OEE Components |
| Cost Distribution | Pie Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `material_name`, `actual_value_float` |
| Energy Efficiency | Semi-Circular Gauge | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `quantity` |
| KPI Performance | Radar Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `actual_value_float`, `setpoint_float`, `quantity`, `batch_act_start` |
| Cost Breakdown | Bar Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `material_name`, `actual_value_float` |
| Energy Consumption | Line Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `quantity` |
| Management KPIs | Composed Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `setpoint_float`, `actual_value_float` |
| Delay Analysis | Bar Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_guid`, `batch_act_end`, `batch_transfer_time`, `formula_category_name` |
| Shift Efficiency | Doughnut + Gauges | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `setpoint_float`, `actual_value_float` |
| Peak Load Hours | Area Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `quantity` |
| Efficiency Trend | Line Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `actual_value_float`, `quantity` |
| Cost Variance Trend | Area Chart | ✅ Yes | `/api/kpi/dashboard-analytics` | Date, Batch, Product, Material | `batch_act_start`, `setpoint_float`, `actual_value_float` |

### 3.2 KPI Dashboard - All Charts

| Chart Name | Chart Type | Real-Time | API Endpoint | Filters | Key Database Columns |
|------------|------------|-----------|--------------|---------|---------------------|
| Material Weight per Day | Bar Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `batch_act_start`, `actual_value_float` |
| Products by Count | Pie Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `product_name` |
| No. Batches by Weekday | Bar Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `batch_act_start`, `batch_guid` |
| Throughput Trend | Line Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `batch_act_start`, `batch_guid` |
| Efficiency vs Complexity | Bar Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `product_name`, `material_name` |
| Error Percentage | Bar Chart | ✅ Yes (on apply) | `/api/kpi` | Date, Batch, Product, Material | `material_name`, `setpoint_float`, `actual_value_float` |
| PLC Live Data Trend | Line Chart | ✅ Yes (10s interval) | `/api/db4/live/read`, `/api/db3/live/read` | None (live only) | Live streaming data |
| PLC Detailed Data | Multi-Line Chart | ✅ Yes (10s interval) | `/api/db4/live/read`, `/api/db3/live/read` | Toggle visibility | Live streaming data |
| Throughput Trend (PLC) | Line Chart | ✅ Yes (10s interval) | `/api/db4/live/read` | Filtered view | `pellet1_ton_hr`, `pellet2_ton_hr`, `pellet3_ton_hr` |
| Temperature Trend (PLC) | Line Chart | ✅ Yes (10s interval) | `/api/db4/live/read` | Filtered view | `pellet1_temp`, `pellet2_temp`, `pellet3_temp` |
| Amps Trend (PLC) | Line Chart | ✅ Yes (10s interval) | `/api/db3/live/read` | Filtered view | `hammermill_amp`, `rollermill_amp` |

---

## 4. DATA FLOW DIAGRAM

### 4.1 KPI Overview Data Flow

```
User Sets Date Range
    ↓
Frontend: fetchDashboardAnalytics(startDate, endDate, filters)
    ↓
API: GET /api/kpi/dashboard-analytics?startDate=...&endDate=...&batch=...&product=...&material=...
    ↓
Backend: Query KPIMaterial table with filters
    ↓
Backend: Process all data (17 different calculations)
    ↓
Backend: Return JSON with {summary, charts, metadata}
    ↓
Frontend: Transform API data to chart format
    ↓
Frontend: Render 12 charts + 5 KPI summary cards
    ↓
Auto-refresh every 60 seconds (if isRealTime = true)
```

### 4.2 KPI Dashboard Data Flow

#### Historical Data:
```
User Sets Filters & Clicks "Apply Filters"
    ↓
Frontend: fetchGraphData() with filters
    ↓
API: GET /api/kpi?startDate=...&endDate=...&batch=...&product=...&material=...
    ↓
Backend: Query KPIMaterial table with filters
    ↓
Backend: Return array of material records
    ↓
Frontend: calculateKPIsAndCharts(data)
    ↓
Frontend: Calculate 6 charts from raw data
    ↓
Frontend: Render charts
```

#### Live PLC Data:
```
User Starts Streaming
    ↓
Frontend: useLiveData() hook starts WebSocket connection
    ↓
API: WebSocket connection to /api/start_live_stream
    ↓
Backend: Streams DB4 data (pellet metrics)
    ↓
Frontend: fetchDB3Data() polls every 5 seconds
    ↓
API: GET /api/db3/live/read
    ↓
Backend: Returns DB3 data (mill metrics)
    ↓
Frontend: Update PLC charts every 10 seconds
    ↓
Frontend: Render live charts
```

---

## 5. KEY DIFFERENCES

### 5.1 KPI Overview vs KPI Dashboard

| Aspect | KPI Overview | KPI Dashboard |
|--------|--------------|---------------|
| **Primary Purpose** | Comprehensive analytics dashboard | Historical analysis + Live PLC monitoring |
| **Data Refresh** | Auto-refresh every 60s | Manual refresh (Apply Filters) + Live streaming |
| **API Endpoint** | `/api/kpi/dashboard-analytics` | `/api/kpi` (historical) + Live endpoints |
| **Chart Count** | 12 charts + 5 KPI cards | 6 historical charts + 5 PLC live charts |
| **Real-Time Status** | ✅ Yes (60s interval) | ✅ Yes (manual + 5s/10s live) |
| **Default Date Range** | Last 7 days | Last 7 days (7 AM to 7 AM) |
| **Filter Application** | Automatic on date change | Manual (Apply Filters button) |
| **Live Data** | No | Yes (PLC streaming) |

---

## 6. DATABASE QUERY DETAILS

### 6.1 KPI Overview Query Structure

```python
# Base Query
query = KPIMaterial.query.filter(
    KPIMaterial.batch_act_start >= start_date,
    KPIMaterial.batch_act_start <= end_date
)

# Optional Filters
if batch_filters:
    query = query.filter(KPIMaterial.batch_name.in_(batch_filters))
if product_filters:
    query = query.filter(KPIMaterial.product_name.in_(product_filters))
if material_filters:
    query = query.filter(KPIMaterial.material_name.in_(material_filters))

# Exclusion
query = query.filter(func.lower(KPIMaterial.product_name) != 'not selected')

# Execute
materials = query.all()
```

### 6.2 KPI Dashboard Query Structure

```python
# Similar structure but via /api/kpi endpoint
# Returns raw material records for client-side processing
```

---

## 7. CALCULATION FORMULAS

### 7.1 OEE Calculations (KPI Overview)

- **Availability:** `(total_production_hours / planned_hours) × 100`
  - `total_production_hours` = sum of `(batch_act_end - batch_act_start)` per unique batch
  - `planned_hours` = `total_days × 24`

- **Performance:** `(total_actual / total_setpoint) × 100`
  - `total_actual` = sum of `actual_value_float`
  - `total_setpoint` = sum of `setpoint_float`

- **Quality:** `(within_tolerance / total_materials) × 100`
  - `within_tolerance` = count where `abs((actual - setpoint) / setpoint) × 100 <= 5`
  - `total_materials` = total record count

- **OEE:** `(Availability × Performance × Quality) / 10000`

### 7.2 Energy Calculations (KPI Overview)

- **Power Factor:** `min(avg_quantity / 10000, 1.0)`
  - `avg_quantity` = average of all `quantity` values

- **Efficiency:** `total_energy / total_quantity_tons`
  - `total_energy` = sum of `actual_value_float`
  - `total_quantity_tons` = sum of `quantity / 1000`

### 7.3 Delay Calculations (KPI Overview)

- **Delay Duration:** `(batch_transfer_time - batch_act_end)` in minutes
- Only delays > 5 minutes are counted
- Grouped by `formula_category_name`

### 7.4 Shift Calculations (KPI Overview)

- **Shift Assignment:**
  - Shift A: 6:00-14:00
  - Shift B: 14:00-22:00
  - Shift C: 22:00-6:00
- **Efficiency:** `(actual / planned) × 100` per shift

---

## 8. NOTES & OBSERVATIONS

### 8.1 Static/Hardcoded Values

**KPI Overview:**
- `costPerUnit`: 12.5 (hardcoded)
- `roi`: 18.5% (hardcoded)
- `maintenanceCostPerUnit`: 1.8 (hardcoded)
- `rawMaterialCostPerTon`: 8.5 (hardcoded)
- `energyCostPerTon`: 0.42 (hardcoded)
- `cycleTime`: 12.5 (hardcoded)
- `onTimeDelivery`: 96.8% (hardcoded)
- `resourceUtilization`: 87.3% (hardcoded)
- `orderFulfillmentRate`: 94.1% (hardcoded)
- `operatorProductivity`: 125.5 (hardcoded)
- `mtbf`: 450 (hardcoded)
- `mttr`: 2.5 (hardcoded)

**Note:** These values are not calculated from database but are static placeholders.

### 8.2 Data Proxies

- **Energy:** `actual_value_float` is used as a proxy for energy consumption
- **Efficiency:** `actual_value_float / quantity` is used as energy per ton
- **Power Factor:** `quantity` normalized to 0-1 range is used as power factor

### 8.3 Date Handling

- **4-Hour Offset:** Applied to start date only in KPI Overview (for 24-hour period queries)
- **4-Hour Offset:** Applied to both dates in KPI Dashboard (for historical queries)
- **Default Range:** Last 7 days in both dashboards

### 8.4 Real-Time Behavior

- **KPI Overview:** Auto-refreshes every 60 seconds when `isRealTime = true`
- **KPI Dashboard:** 
  - Historical data requires manual "Apply Filters" click
  - PLC data streams continuously when streaming is active (5s DB3, 10s trend updates)

---

## 9. CONCLUSION

### 9.1 KPI Overview
- ✅ **100% Real-Time Data** from database
- ✅ All 12 charts use real-time data
- ✅ 5 KPI summary cards use real-time data
- ✅ Auto-refresh every 60 seconds
- ⚠️ Some metric values are hardcoded (costing-related)

### 9.2 KPI Dashboard
- ✅ **Historical Charts:** 100% Real-Time Data from database (on manual refresh)
- ✅ **PLC Charts:** 100% Live Streaming Data
- ✅ All 6 historical charts use real-time data
- ✅ All 5 PLC charts use live streaming data
- ✅ Manual refresh required for historical data
- ✅ Auto-updates for live PLC data (5-10 second intervals)

---

**Report Generated:** 2025-01-XX
**Last Updated:** Based on current codebase analysis

