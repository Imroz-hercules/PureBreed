from flask import Blueprint, request, jsonify
from extensions import db
from sqlalchemy import text
from datetime import datetime
from utils.timezone_utils import parse_filter_date, parse_filter_end_date

kpi_calendar_bp = Blueprint("kpi_calendar", __name__)

SAUDI_DATE_EXPR = "CAST(DATEADD(HOUR, 3, dbo.[BatchMaterials].[Batch Act Start]) AS DATE)"


@kpi_calendar_bp.route("/kpi_calendar", methods=["GET"])
def get_kpi_calendar():
    try:
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        if not start_date_str or not end_date_str:
            return jsonify({"error": "Start date and end date are required"}), 400

        start_date = parse_filter_date(start_date_str)
        end_date = parse_filter_end_date(end_date_str)

        sql_query = f"""
        SELECT {SAUDI_DATE_EXPR} AS date,
               sum(dbo.[BatchMaterials].[Actual Value Float]) AS total_actual,
               count(distinct(dbo.[BatchMaterials].[Batch GUID])) AS batch_count,
               count(distinct(dbo.[BatchMaterials].[Product Name])) AS product_count
        FROM dbo.[BatchMaterials]
        WHERE dbo.[BatchMaterials].[Batch Act Start] >= :start_date
          AND dbo.[BatchMaterials].[Batch Act Start] <= :end_date
          AND lower(dbo.[BatchMaterials].[Product Name]) != 'not selected'
        GROUP BY {SAUDI_DATE_EXPR}
        ORDER BY {SAUDI_DATE_EXPR}
        """

        results = db.session.execute(
            text(sql_query), {"start_date": start_date, "end_date": end_date}
        ).fetchall()

        data = [
            {
                "date": str(row.date),
                "total_actual_kg": float(row.total_actual or 0),
                "total_actual_ton": float(row.total_actual or 0) / 1000,
                "batch_count": int(row.batch_count),
                "product_count": int(row.product_count),
            }
            for row in results
        ]
        return jsonify(data), 200

    except Exception as e:
        import traceback
        print(f"Error in get_kpi_calendar: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@kpi_calendar_bp.route("/kpi_calendar/details", methods=["GET"])
def get_kpi_calendar_details():
    try:
        date_str = request.args.get("date")
        if not date_str:
            return jsonify({"error": "Date is required"}), 400

        try:
            target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
        except ValueError:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        sql_query = f"""
        SELECT dbo.[BatchMaterials].[Product Name] as product_name,
               SUM(dbo.[BatchMaterials].[Actual Value Float]) as quantity_kg
        FROM dbo.[BatchMaterials]
        WHERE {SAUDI_DATE_EXPR} = :target_date
          AND lower(dbo.[BatchMaterials].[Product Name]) != 'not selected'
        GROUP BY dbo.[BatchMaterials].[Product Name]
        ORDER BY quantity_kg DESC
        """

        results = db.session.execute(
            text(sql_query), {"target_date": target_date}
        ).fetchall()

        details = [
            {
                "product_name": row.product_name,
                "quantity_kg": float(row.quantity_kg or 0),
            }
            for row in results
        ]

        return jsonify(details), 200

    except Exception as e:
        import traceback
        print(f"Error in get_kpi_calendar_details: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
