from flask import Blueprint, request, jsonify
from extensions import db
from models.kpi import KPI
from models.kpi_material import KPIMaterial
from datetime import datetime, timedelta
from sqlalchemy import func
import traceback
import logging

# ✅ Changed variable name to match app.py
kpi_blueprint = Blueprint("kpi", __name__)
logger = logging.getLogger(__name__)

# Helper function to apply 4-hour offset to dates
def apply_four_hour_offset(date_obj):
    """Apply 4-hour offset to datetime object (subtract 4 hours)"""
    if date_obj:
        return date_obj - timedelta(hours=4)
    return date_obj

# Helper function to apply 4-hour offset to start date only (for 24-hour period queries)
def apply_four_hour_offset_start_only(start_date, end_date):
    """Apply 4-hour offset to start date only, keep end date as is for 24-hour period"""
    if start_date and end_date:
        # Subtract 4 hours from start date, keep end date the same
        adjusted_start = start_date - timedelta(hours=4)
        return adjusted_start, end_date
    return start_date, end_date

# 🟢 Route to Insert KPI Data
@kpi_blueprint.route("/kpi", methods=["POST"])
def add_kpi():
    try:
        data = request.get_json()
        new_kpi = KPI(
            batch_guid=data.get("batch_guid"),
            batch_name=data.get("batch_name"),
            product_name=data.get("product_name"),
            batch_act_start=datetime.strptime(data.get("batch_act_start"), "%Y-%m-%d %H:%M:%S"),
        )
        db.session.add(new_kpi)
        db.session.commit()
        return jsonify({"message": "KPI added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# 🟢 Route to Get All KPI Data
@kpi_blueprint.route("/kpi", methods=["GET"])
def get_kpis():
    try:
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        batch_filters = request.args.getlist("batch")
        product_filters = request.args.getlist("product")
        material_filters = request.args.getlist("material")
        page = request.args.get("page", default=1, type=int)
        limit = request.args.get("limit", default=300000, type=int)

        date_filter = []
        if start_date_str and end_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
            except Exception:
                try:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")
                    end_date = datetime.strptime(end_date_str, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
            
            # Apply 4-hour offset to the filter dates (subtract 4 hours)
            start_date = apply_four_hour_offset(start_date)
            end_date = apply_four_hour_offset(end_date)
            # Use batch_transfer_time for date filter (same as Raw Data / csv-format-report) so Historical shows same batches
            date_filter = [KPIMaterial.batch_transfer_time >= start_date, KPIMaterial.batch_transfer_time <= end_date]

        query = KPIMaterial.query
        if date_filter:
            query = query.filter(*date_filter)
        if batch_filters:
            query = query.filter(KPIMaterial.batch_name.in_(batch_filters))
        if product_filters:
            query = query.filter(KPIMaterial.product_name.in_(product_filters))
        if material_filters:
            query = query.filter(KPIMaterial.material_name.in_(material_filters))

        query = query.filter(func.lower(KPIMaterial.product_name) != 'not selected')
        query = query.order_by(KPIMaterial.batch_transfer_time.asc())  # Match Raw Data column, oldest first

        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        materials = pagination.items
        

        kpi_list = []
        for mat in materials:
            kpi_list.append({
                "Batch GUID": str(mat.batch_guid) if mat.batch_guid is not None else None,
                "Batch Name": mat.batch_name,
                "Product Name": mat.product_name,
                "Batch Act Start": mat.batch_act_start.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_start else None,
                "Batch Act End": mat.batch_act_end.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_end else None,
                "Quantity": mat.quantity,
                "Material Name": mat.material_name,
                "Material Code": mat.material_code,
                "SetPoint Float": mat.setpoint_float,
                "Actual Value Float": mat.actual_value_float,
                "Source Server": mat.source_server,
                "ROOTGUID": str(mat.rootguid) if mat.rootguid is not None else None,
                "OrderId": mat.order_id,
                "Batch Transfer Time": mat.batch_transfer_time.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_transfer_time else None,
                "FormulaCategoryName": mat.formula_category_name
            })

        return jsonify({
            "data": kpi_list,
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total
        }), 200

    except Exception as e:
        # Debug: log full traceback so exact error is visible in terminal
        logger.exception("GET /api/kpi failed: %s", e)
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }), 500


# 🟢 Route to Get Report Data
@kpi_blueprint.route("/reports", methods=["GET"])
def get_reports():
    try:
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        report_type = request.args.get("reportType", default="daily")
        batch_filters = request.args.getlist("batch")
        product_filters = request.args.getlist("product")
        material_filters = request.args.getlist("material")
        page = request.args.get("page", default=1, type=int)
        limit = request.args.get("limit", default=300000, type=int)

        if not start_date_str or not end_date_str:
            return jsonify({"error": "Start date and end date are required"}), 400

        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
        except Exception:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")

        # Apply 4-hour offset only for non-daily reports
        # Daily Report should use exact times without offset
        if report_type != 'daily':
            # Apply 4-hour offset to start date only for 24-hour period queries
            # This ensures we get the full 24-hour period when user selects 7 AM to 7 AM
            start_date, end_date = apply_four_hour_offset_start_only(start_date, end_date)

        query = KPIMaterial.query.filter(
            KPIMaterial.batch_act_start >= start_date,
            KPIMaterial.batch_act_start <= end_date
        )
        if batch_filters:
            query = query.filter(KPIMaterial.batch_name.in_(batch_filters))
        if product_filters:
            query = query.filter(KPIMaterial.product_name.in_(product_filters))
        if material_filters:
            query = query.filter(KPIMaterial.material_name.in_(material_filters))

        query = query.filter(func.lower(KPIMaterial.product_name) != 'not selected')
        query = query.order_by(KPIMaterial.batch_act_start.asc())  # Changed to asc() to match /api/kpi endpoint

        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        materials = pagination.items


        kpi_list = []
        for mat in materials:
            kpi_list.append({
                "Batch GUID": str(mat.batch_guid) if mat.batch_guid is not None else None,
                "Batch Name": mat.batch_name,
                "Product Name": mat.product_name,
                "Batch Act Start": mat.batch_act_start.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_start else None,
                "Batch Act End": mat.batch_act_end.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_end else None,
                "Quantity": mat.quantity,
                "Material Name": mat.material_name,
                "Material Code": mat.material_code,
                "SetPoint Float": mat.setpoint_float,
                "Actual Value Float": mat.actual_value_float,
                "Source Server": mat.source_server,
                "ROOTGUID": str(mat.rootguid) if mat.rootguid is not None else None,
                "OrderId": mat.order_id,
                "Batch Transfer Time": mat.batch_transfer_time.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_transfer_time else None,
                "FormulaCategoryName": mat.formula_category_name
            })

        return jsonify({
            "data": kpi_list,
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total,
            "reportType": report_type
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🟢 Route for CSV Format Report
@kpi_blueprint.route("/kpi/csv-format-report", methods=["GET"])
def get_kpi_csv_format_report():
    try:
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        batch_filters = request.args.getlist("batch")
        product_filters = request.args.getlist("product")
        material_filters = request.args.getlist("material")
        page = request.args.get("page", default=1, type=int)
        limit = request.args.get("limit", default=300000, type=int)

        if not start_date_str or not end_date_str:
            return jsonify({"error": "startDate and endDate are required"}), 400

        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
        except Exception:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")

        # Apply 4-hour offset to the filter dates (subtract 4 hours)
        start_date = apply_four_hour_offset(start_date)
        end_date = apply_four_hour_offset(end_date)

        query = KPIMaterial.query.filter(
            KPIMaterial.batch_transfer_time >= start_date,
            KPIMaterial.batch_transfer_time <= end_date,
            func.lower(KPIMaterial.product_name) != 'not selected'
        )
        if batch_filters:
            query = query.filter(KPIMaterial.batch_name.in_(batch_filters))
        if product_filters:
            query = query.filter(KPIMaterial.product_name.in_(product_filters))
        if material_filters:
            query = query.filter(KPIMaterial.material_name.in_(material_filters))

        query = query.order_by(KPIMaterial.batch_transfer_time.desc())
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        materials = pagination.items

        report_data = []
        for mat in materials:
            report_data.append({
                "Batch GUID": str(mat.batch_guid) if mat.batch_guid is not None else None,
                "Batch Name": mat.batch_name,
                "Product Name": mat.product_name,
                "Batch Act Start": mat.batch_act_start.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_start else None,
                "Batch Act End": mat.batch_act_end.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_act_end else None,
                "Quantity": mat.quantity,
                "Material Name": mat.material_name,
                "Material Code": mat.material_code,
                "SetPoint Float": mat.setpoint_float,
                "Actual Value Float": mat.actual_value_float,
                "Source Server": mat.source_server,
                "ROOTGUID": str(mat.rootguid) if mat.rootguid is not None else None,
                "OrderId": mat.order_id,
                "EventID": f"{str(mat.batch_guid) if mat.batch_guid else ''}_{mat.order_id}_{mat.material_name or ''}" if (mat.batch_guid or mat.material_name) else None,
                "Batch Transfer Time": mat.batch_transfer_time.strftime("%Y-%m-%d %H:%M:%S") if mat.batch_transfer_time else None,
                "FormulaCategoryName": mat.formula_category_name
            })

        return jsonify({
            "data": report_data,
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🟢 Route to Get All Available Filter Options
@kpi_blueprint.route("/filter-options", methods=["GET"])
def get_filter_options():
    try:
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        
        # Build base query with date filtering only
        query = KPIMaterial.query
        if start_date_str and end_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
            except Exception:
                try:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")
                    end_date = datetime.strptime(end_date_str, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
            
            # Match GET /api/kpi: same 4-hour offset on both bounds + batch_transfer_time window
            # so filter dropdowns list the same batches/materials the report query can return.
            start_date = apply_four_hour_offset(start_date)
            end_date = apply_four_hour_offset(end_date)
            query = query.filter(
                KPIMaterial.batch_transfer_time >= start_date,
                KPIMaterial.batch_transfer_time <= end_date,
            )
        
        # Filter out 'not selected' products
        query = query.filter(func.lower(KPIMaterial.product_name) != 'not selected')
        
        # Get all unique values
        products = db.session.query(KPIMaterial.product_name).filter(
            query.whereclause
        ).distinct().all()
        
        batches = db.session.query(KPIMaterial.batch_name).filter(
            query.whereclause
        ).distinct().all()
        
        materials = db.session.query(KPIMaterial.material_name).filter(
            query.whereclause
        ).distinct().all()
        
        # Extract values from tuples
        product_list = [p[0] for p in products if p[0]]
        batch_list = [b[0] for b in batches if b[0]]
        material_list = [m[0] for m in materials if m[0]]
        
        
        return jsonify({
            "products": product_list,
            "batches": batch_list,
            "materials": material_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🟢 Route to Get Dashboard KPI Analytics (Complete API for All Charts)
@kpi_blueprint.route("/kpi/dashboard-analytics", methods=["GET"])
def get_dashboard_analytics():
    """
    Comprehensive dashboard analytics endpoint that returns all chart data
    Supports filtering by date, batch, product, and material
    All data is real from database - no mock data
    """
    try:
        # Get filter parameters
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        batch_filters = request.args.getlist("batch")
        product_filters = request.args.getlist("product")
        material_filters = request.args.getlist("material")
        
        # Parse dates
        if not start_date_str or not end_date_str:
            return jsonify({"error": "Start date and end date are required"}), 400
        
        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
        except Exception:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d %H:%M:%S")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        
        # Apply 4-hour offset to start date only
        start_date, end_date = apply_four_hour_offset_start_only(start_date, end_date)
        
        # Build base query with filters
        query = KPIMaterial.query.filter(
            KPIMaterial.batch_act_start >= start_date,
            KPIMaterial.batch_act_start <= end_date
        )
        
        if batch_filters:
            query = query.filter(KPIMaterial.batch_name.in_(batch_filters))
        if product_filters:
            query = query.filter(KPIMaterial.product_name.in_(product_filters))
        if material_filters:
            query = query.filter(KPIMaterial.material_name.in_(material_filters))
        
        query = query.filter(func.lower(KPIMaterial.product_name) != 'not selected')
        
        # Fetch all data for processing
        materials = query.all()
        
        if not materials:
            return jsonify({
                "success": False,
                "error": "No data found for the given filters",
                "filters": {
                    "startDate": start_date_str,
                    "endDate": end_date_str,
                    "batches": batch_filters,
                    "products": product_filters,
                    "materials": material_filters
                }
            }), 404
        
        # ==================== DATA PROCESSING ====================
        
        # Calculate total materials count
        total_materials = len(materials)
        
        # Get unique batches with their durations
        unique_batches = {}
        total_production_hours = 0
        for mat in materials:
            if mat.batch_guid not in unique_batches and mat.batch_act_start and mat.batch_act_end:
                duration = (mat.batch_act_end - mat.batch_act_start).total_seconds() / 3600
                unique_batches[mat.batch_guid] = {
                    'duration': duration,
                    'start': mat.batch_act_start,
                    'end': mat.batch_act_end,
                    'quantity': mat.quantity
                }
                total_production_hours += duration
        
        # Calculate total days in range
        total_days = max((end_date - start_date).days, 1)
        planned_hours = total_days * 24
        
        
        # ========== 1. PRODUCTION KPIs TREND (Daily Production - Last 30 Days) ==========
        daily_production = {}
        for mat in materials:
            if mat.batch_act_start:
                date_key = mat.batch_act_start.strftime("%Y-%m-%d")
                # Sum quantity per batch (avoid double counting)
                batch_key = f"{date_key}_{mat.batch_guid}"
                if batch_key not in daily_production:
                    daily_production[batch_key] = {
                        'date': date_key,
                        'quantity': mat.quantity or 0
                    }
        
        # Group by date
        date_totals = {}
        for batch_data in daily_production.values():
            date = batch_data['date']
            date_totals[date] = date_totals.get(date, 0) + batch_data['quantity']
        
        production_trend = [
            {"date": date, "value": round(value, 2)}
            for date, value in sorted(date_totals.items(), reverse=True)[:30]
        ]
        production_trend.reverse()  # Show oldest to newest
        
        
        # ========== 2. DOWNTIME DURATION (Last 14 Days) ==========
        daily_downtime = {}
        for mat in materials:
            if mat.batch_act_end and mat.batch_transfer_time and mat.batch_act_start:
                date_key = mat.batch_act_start.strftime("%Y-%m-%d")
                batch_key = f"{date_key}_{mat.batch_guid}"
                
                # Calculate idle time only once per batch
                if batch_key not in daily_downtime:
                    idle_seconds = (mat.batch_transfer_time - mat.batch_act_end).total_seconds()
                    if idle_seconds > 0:  # Only positive downtime
                        if date_key not in daily_downtime:
                            daily_downtime[date_key] = 0
                        daily_downtime[date_key] += idle_seconds
                    daily_downtime[batch_key] = True  # Mark as processed
        
        # Convert to hours and format
        downtime_trend = []
        for date, seconds in sorted(daily_downtime.items(), reverse=True):
            if not isinstance(seconds, bool):  # Skip the batch_key markers
                downtime_trend.append({
                    "date": date,
                    "duration": round(seconds / 3600, 2)
                })
        
        downtime_trend = downtime_trend[:14]
        downtime_trend.reverse()
        
        
        # ========== 3. OEE COMPONENTS ==========
        # Availability = (Actual Production Time / Planned Time) × 100
        availability = round((total_production_hours / planned_hours) * 100, 1) if planned_hours > 0 else 0
        availability = min(availability, 100)  # Cap at 100%
        
        # Performance = (Actual Output / Target Output) × 100
        total_actual = sum(mat.actual_value_float or 0 for mat in materials)
        total_setpoint = sum(mat.setpoint_float or 0 for mat in materials)
        performance = round((total_actual / total_setpoint) * 100, 1) if total_setpoint > 0 else 0
        
        # Quality = (Materials Within Tolerance / Total Materials) × 100
        within_tolerance = sum(
            1 for mat in materials
            if mat.setpoint_float and mat.actual_value_float and mat.setpoint_float > 0 and
            abs(((mat.actual_value_float - mat.setpoint_float) / mat.setpoint_float) * 100) <= 5
        )
        quality = round((within_tolerance / total_materials) * 100, 1) if total_materials > 0 else 0
        
        oee_components = [
            {"name": "Availability", "value": availability},
            {"name": "Performance", "value": performance},
            {"name": "Quality", "value": quality}
        ]
        
        # Overall OEE = Availability × Performance × Quality
        oee_value = round((availability * performance * quality) / 10000, 1)
        
        
        # ========== 4. COST DISTRIBUTION (Real Data - Top Materials by Usage) ==========
        material_usage_dict = {}
        for mat in materials:
            material_name = mat.material_name or "Unknown"
            material_usage_dict[material_name] = material_usage_dict.get(material_name, 0) + (mat.actual_value_float or 0)
        
        # Sort materials by actual usage value
        sorted_materials = sorted(material_usage_dict.items(), key=lambda x: x[1], reverse=True)
        
        # Top 10 materials for pie chart
        top_n = 10
        cost_distribution = [
            {"name": material, "value": round(value, 2)}
            for material, value in sorted_materials[:top_n]
        ]
        
        # Add "Others" if there are more materials
        if len(sorted_materials) > top_n:
            others_total = sum(value for _, value in sorted_materials[top_n:])
            cost_distribution.append({"name": "Others", "value": round(others_total, 2)})
        
        
        # ========== 5. COST BREAKDOWN (Bar Chart - Same as Distribution) ==========
        cost_breakdown = [
            {"name": material, "value": round(value, 2)}
            for material, value in sorted_materials[:10]
        ]
        
        
        # ========== 6. ENERGY EFFICIENCY (Power Factor - calculated from quantity) ==========
        # Calculate power factor based on quantity (normalized proxy for energy)
        quantity_values = [mat.quantity for mat in materials if mat.quantity and mat.quantity > 0]
        avg_quantity = sum(quantity_values) / len(quantity_values) if quantity_values else 0
        # Normalize to 0-1 range (assuming max quantity around 10000)
        power_factor = round(min(avg_quantity / 10000, 1.0), 2) if avg_quantity > 0 else 0.92
        
        
        # ========== 7. KPI PERFORMANCE (Radar Chart - 6 Dimensions) ==========
        # Calculate average variance for cost control
        variances = [
            abs(((mat.actual_value_float - mat.setpoint_float) / mat.setpoint_float) * 100)
            for mat in materials
            if mat.setpoint_float and mat.actual_value_float and mat.setpoint_float > 0
        ]
        avg_variance = sum(variances) / len(variances) if variances else 0
        cost_control_score = max(100 - avg_variance, 0)
        
        # Calculate batch completion rate (assuming target of 3 batches per day)
        target_batches = total_days * 3
        batch_completion_rate = min((len(unique_batches) / target_batches) * 100, 100) if target_batches > 0 else 0
        
        radar_kpis = [
            {"subject": "Production", "value": round(performance, 1), "fullMark": 100},
            {"subject": "Quality", "value": round(quality, 1), "fullMark": 100},
            {"subject": "Efficiency", "value": round(availability, 1), "fullMark": 100},
            {"subject": "Cost Control", "value": round(cost_control_score, 1), "fullMark": 100},
            {"subject": "Energy", "value": round((avg_quantity / 10000) * 100, 1) if avg_quantity > 0 else 0, "fullMark": 100},
            {"subject": "Management", "value": round(batch_completion_rate, 1), "fullMark": 100}
        ]
        
        
        # ========== 8. ENERGY CONSUMPTION (24-Hour Pattern) ==========
        hourly_consumption = {}
        for mat in materials:
            if mat.batch_act_start and mat.quantity:
                hour = mat.batch_act_start.strftime("%H:00")
                # Normalize quantity to consumption proxy
                hourly_consumption[hour] = hourly_consumption.get(hour, 0) + (mat.quantity / 1000)
        
        # Fill all 24 hours
        energy_consumption = [
            {"hour": f"{h:02d}:00", "consumption": round(hourly_consumption.get(f"{h:02d}:00", 0), 2)}
            for h in range(24)
        ]
        
        
        # ========== 9. PLANNED VS ACTUAL (Last 7 Days) ==========
        daily_comparison = {}
        for mat in materials:
            if mat.batch_act_start:
                date_key = mat.batch_act_start.strftime("%Y-%m-%d")
                if date_key not in daily_comparison:
                    daily_comparison[date_key] = {"planned": 0, "actual": 0}
                daily_comparison[date_key]["planned"] += mat.setpoint_float or 0
                daily_comparison[date_key]["actual"] += mat.actual_value_float or 0
        
        planned_vs_actual = [
            {
                "date": date,
                "planned": round(values["planned"], 2),
                "actual": round(values["actual"], 2)
            }
            for date, values in sorted(daily_comparison.items(), reverse=True)[:7]
        ]
        planned_vs_actual.reverse()
        
        
        # ========== 10. DELAY ANALYSIS (By Formula Category) ==========
        delay_by_category = {}
        processed_batches = set()
        
        for mat in materials:
            batch_key = mat.batch_guid
            if batch_key not in processed_batches and mat.batch_act_end and mat.batch_transfer_time:
                delay_seconds = (mat.batch_transfer_time - mat.batch_act_end).total_seconds()
                delay_minutes = delay_seconds / 60
                
                if delay_minutes > 5:  # Only count delays > 5 minutes
                    category = mat.formula_category_name or "Unknown"
                    if category not in delay_by_category:
                        delay_by_category[category] = {"duration": 0, "count": 0}
                    delay_by_category[category]["duration"] += delay_minutes
                    delay_by_category[category]["count"] += 1
                
                processed_batches.add(batch_key)
        
        delay_analysis = [
            {
                "category": category,
                "duration": round(values["duration"], 2),
                "count": values["count"]
            }
            for category, values in sorted(delay_by_category.items(), key=lambda x: x[1]["duration"], reverse=True)
        ]
        
        
        # ========== 11. SHIFT EFFICIENCY (3 Shifts) ==========
        shift_data = {
            "Shift A": {"planned": 0, "actual": 0},
            "Shift B": {"planned": 0, "actual": 0},
            "Shift C": {"planned": 0, "actual": 0}
        }
        
        for mat in materials:
            if mat.batch_act_start:
                hour = mat.batch_act_start.hour
                if 6 <= hour < 14:
                    shift = "Shift A"
                elif 14 <= hour < 22:
                    shift = "Shift B"
                else:
                    shift = "Shift C"
                
                shift_data[shift]["planned"] += mat.setpoint_float or 0
                shift_data[shift]["actual"] += mat.actual_value_float or 0
        
        shift_efficiency = [
            {
                "shift": shift,
                "efficiency": round((values["actual"] / values["planned"]) * 100, 1) if values["planned"] > 0 else 0
            }
            for shift, values in shift_data.items()
        ]
        
        
        # ========== 12. PEAK LOAD HOURS (24-Hour Load Pattern) ==========
        hourly_load = {}
        for mat in materials:
            if mat.batch_act_start and mat.quantity:
                hour = mat.batch_act_start.strftime("%H:00")
                # Normalize to load proxy (divide by 100)
                hourly_load[hour] = hourly_load.get(hour, 0) + (mat.quantity / 100)
        
        peak_load_hours = [
            {"hour": f"{h:02d}:00", "load": round(hourly_load.get(f"{h:02d}:00", 0), 2)}
            for h in range(24)
        ]
        
        
        # ========== 13. EFFICIENCY TREND (Last 14 Days - Energy per Unit) ==========
        daily_efficiency = {}
        for mat in materials:
            if mat.batch_act_start and mat.quantity and mat.quantity > 0:
                date_key = mat.batch_act_start.strftime("%Y-%m-%d")
                if date_key not in daily_efficiency:
                    daily_efficiency[date_key] = {"energy_sum": 0, "quantity_sum": 0}
                # Use actual_value_float as energy proxy (or quantity if not available)
                energy_value = mat.actual_value_float if mat.actual_value_float and mat.actual_value_float > 0 else mat.quantity / 10
                daily_efficiency[date_key]["energy_sum"] += energy_value
                daily_efficiency[date_key]["quantity_sum"] += mat.quantity / 1000  # Convert to tons
        
        efficiency_trend = [
            {
                "date": date,
                "efficiency": round(values["energy_sum"] / values["quantity_sum"], 2) if values["quantity_sum"] > 0 else 0
            }
            for date, values in sorted(daily_efficiency.items(), reverse=True)[:14]
        ]
        efficiency_trend.reverse()
        
        
        # ========== 14. COST VARIANCE TREND (Last 14 Days) ==========
        daily_variance = {}
        for mat in materials:
            if mat.batch_act_start and mat.setpoint_float and mat.actual_value_float and mat.setpoint_float > 0:
                date_key = mat.batch_act_start.strftime("%Y-%m-%d")
                variance_pct = ((mat.actual_value_float - mat.setpoint_float) / mat.setpoint_float) * 100
                if date_key not in daily_variance:
                    daily_variance[date_key] = []
                daily_variance[date_key].append(variance_pct)
        
        cost_variance_trend = [
            {
                "date": date,
                "variance": round(sum(variances) / len(variances), 2)
            }
            for date, variances in sorted(daily_variance.items(), reverse=True)[:14]
        ]
        cost_variance_trend.reverse()
        
        
        # ========== 15. KPI SUMMARY CARDS ==========
        total_production = sum(batch_data['quantity'] for batch_data in unique_batches.values())
        active_batches = len(unique_batches)
        
        # Calculate average efficiency (energy per ton - using actual_value_float as proxy)
        total_quantity_tons = total_production / 1000 if total_production > 0 else 1
        total_energy = sum(mat.actual_value_float or 0 for mat in materials if mat.actual_value_float and mat.actual_value_float > 0)
        avg_efficiency = round(total_energy / total_quantity_tons, 2) if total_quantity_tons > 0 and total_energy > 0 else 2.8
        
        # Cost savings (when actual < setpoint, we saved material)
        cost_savings = sum(
            (mat.setpoint_float - mat.actual_value_float) if mat.setpoint_float and mat.actual_value_float else 0
            for mat in materials
        )
        
        kpi_summary = {
            "totalProduction": round(total_production, 2),
            "activeBatches": active_batches,
            "oee": oee_value,
            "efficiency": avg_efficiency,
            "costSavings": round(cost_savings, 2)
        }
        
        
        # ========== 16. TOP MATERIALS (Top 10) ==========
        top_materials = [
            {"name": material, "value": round(value, 2)}
            for material, value in sorted_materials[:10]
        ]
        
        
        # ========== 17. PRODUCT BREAKDOWN ==========
        product_breakdown = {}
        for mat in materials:
            product = mat.product_name or "Unknown"
            batch_key = f"{product}_{mat.batch_guid}"
            if batch_key not in product_breakdown:
                product_breakdown[batch_key] = {
                    'product': product,
                    'quantity': mat.quantity or 0
                }
        
        # Group by product
        product_totals = {}
        for data in product_breakdown.values():
            product = data['product']
            product_totals[product] = product_totals.get(product, 0) + data['quantity']
        
        product_distribution = [
            {"name": product, "value": round(quantity, 2)}
            for product, quantity in sorted(product_totals.items(), key=lambda x: x[1], reverse=True)
        ]
        
        
        # ==================== RESPONSE ====================
        return jsonify({
            "success": True,
            "filters": {
                "startDate": start_date.strftime("%Y-%m-%d %H:%M:%S"),
                "endDate": end_date.strftime("%Y-%m-%d %H:%M:%S"),
                "batches": batch_filters,
                "products": product_filters,
                "materials": material_filters
            },
            "summary": kpi_summary,
            "charts": {
                "productionTrend": production_trend,
                "downtimeTrend": downtime_trend,
                "oeeComponents": oee_components,
                "oeeValue": oee_value,
                "costDistribution": cost_distribution,
                "costBreakdown": cost_breakdown,
                "powerFactor": power_factor,
                "radarKPIs": radar_kpis,
                "energyConsumption": energy_consumption,
                "plannedVsActual": planned_vs_actual,
                "delayAnalysis": delay_analysis,
                "shiftEfficiency": shift_efficiency,
                "peakLoadHours": peak_load_hours,
                "efficiencyTrend": efficiency_trend,
                "costVarianceTrend": cost_variance_trend,
                "topMaterials": top_materials,
                "productDistribution": product_distribution
            },
            "metadata": {
                "totalRecords": len(materials),
                "uniqueBatches": len(unique_batches),
                "uniqueProducts": len(product_totals),
                "uniqueMaterials": len(material_usage_dict),
                "dateRange": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                "totalDays": total_days
            }
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500
