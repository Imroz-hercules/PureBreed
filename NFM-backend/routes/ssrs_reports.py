"""Historical report APIs — RDL-style SQL against Hercules.dbo.BatchMaterials."""
from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, List, Optional

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from extensions import db
from utils.ssrs_time import (
    begin_end_times,
    expand_in,
    parse_date,
    parse_multi,
)

logger = logging.getLogger(__name__)

ssrs_bp = Blueprint("ssrs_reports", __name__)


def _ssrs_engine():
    binds = db.engines
    if "ssrs" not in binds:
        return None
    return binds["ssrs"]


def _require_engine():
    engine = _ssrs_engine()
    if engine is None:
        return None, (
            jsonify(
                {
                    "error": "Report database not configured",
                    "detail": "Set the report database URI (SSRS_DATABASE_URI) on the server",
                }
            ),
            503,
        )
    return engine, None


def _row_to_dict(row) -> dict:
    mapping = row._mapping if hasattr(row, "_mapping") else dict(row)
    out = {}
    for k, v in mapping.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat(sep=" ", timespec="seconds")
        elif hasattr(v, "isoformat") and not isinstance(v, str):
            try:
                out[k] = v.isoformat()
            except Exception:
                out[k] = str(v)
        else:
            out[k] = v
    return out


def _fetch_all(sql: str, params: dict) -> List[dict]:
    engine, err = _require_engine()
    if err:
        raise RuntimeError("NO_ENGINE")
    with engine.connect() as conn:
        result = conn.execute(text(sql), params)
        return [_row_to_dict(r) for r in result]


def _parse_range():
    begin_s = request.args.get("beginDate") or request.args.get("startDate")
    end_s = request.args.get("endDate")
    if not begin_s or not end_s:
        return None, None, None, None, (
            jsonify({"error": "beginDate and endDate are required"}),
            400,
        )
    try:
        begin_date = parse_date(begin_s)
        end_date = parse_date(end_s)
        begin_hour = int(request.args.get("beginHour", 7))
        end_hour = int(request.args.get("endHour", 23))
    except (ValueError, TypeError) as e:
        return None, None, None, None, (jsonify({"error": f"Invalid date/hour: {e}"}), 400)
    begin_time, end_time = begin_end_times(begin_date, end_date, begin_hour, end_hour)
    return begin_date, end_date, begin_time, end_time, None


def _multi(name: str) -> List[str]:
    # support ?product=a&product=b and ?product=a,b
    repeated = request.args.getlist(name)
    if len(repeated) > 1:
        return parse_multi(None, repeated)
    if len(repeated) == 1:
        return parse_multi(repeated[0])
    return parse_multi(request.args.get(name))


@ssrs_bp.route("/ssrs/health", methods=["GET"])
def ssrs_health():
    engine, err = _require_engine()
    if err:
        return err
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({"ok": True, "bind": "ssrs"}), 200
    except Exception as e:
        logger.exception("SSRS health failed")
        return jsonify({"ok": False, "error": str(e)}), 500


@ssrs_bp.route("/ssrs/meta/date-bounds", methods=["GET"])
def ssrs_date_bounds():
    """Min/max [Batch Act End] on BatchMaterials — drives default filter dates."""
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    try:
        rows = _fetch_all(
            """
            SELECT
              MIN([Batch Act End]) AS min_act_end,
              MAX([Batch Act End]) AS max_act_end,
              COUNT(*) AS row_count
            FROM dbo.BatchMaterials
            WHERE [Batch Act End] IS NOT NULL
            """,
            {},
        )
        row = rows[0] if rows else {}
        return jsonify(row), 200
    except Exception as e:
        logger.exception("date-bounds failed")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Feed Production
# ---------------------------------------------------------------------------
@ssrs_bp.route("/ssrs/feed-production", methods=["GET"])
def feed_production():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    sql = """
        SELECT DISTINCT
          ISNULL(FormulaCategoryName, N'') AS OrderCat_Name,
          [Batch Act End] AS Batch_ActEnd,
          [Batch Name] AS Batch_RecpName,
          [Product Name] AS Batch_FormulaName,
          Quantity AS Batch_QTY
        FROM dbo.BatchMaterials
        WHERE [Batch Act End] BETWEEN :begin_time AND :end_time
        ORDER BY OrderCat_Name ASC
    """
    try:
        rows = _fetch_all(sql, {"begin_time": begin_time, "end_time": end_time})
        return jsonify({"data": rows, "beginTime": begin_time.isoformat(), "endTime": end_time.isoformat()}), 200
    except Exception as e:
        logger.exception("feed-production failed")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Raw Material Consumption
# ---------------------------------------------------------------------------
@ssrs_bp.route("/ssrs/raw-material-consumption/products", methods=["GET"])
def raw_material_products():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    sql = """
        SELECT DISTINCT [Product Name] AS Batch_FormulaName
        FROM dbo.BatchMaterials
        WHERE [Batch Act End] BETWEEN :begin_time AND :end_time
          AND [SetPoint Float] > 0
          AND CAST([Material Code] AS nvarchar(255)) <> N'0'
        ORDER BY [Product Name]
    """
    try:
        rows = _fetch_all(sql, {"begin_time": begin_time, "end_time": end_time})
        products = [r["Batch_FormulaName"] for r in rows if r.get("Batch_FormulaName")]
        return jsonify({"products": products}), 200
    except Exception as e:
        logger.exception("raw-material products failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/raw-material-consumption", methods=["GET"])
def raw_material_consumption():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    products = _multi("product")
    if not products:
        return jsonify({"error": "product filter is required (one or more)"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    in_clause, in_params = expand_in("prod", products)
    sql = f"""
        SELECT
          CONVERT(date, [Batch Act End]) AS Date,
          ISNULL([Product Name], N'') AS Batch_FormulaName,
          ISNULL(FormulaCategoryName, N'') AS OrderCat_Name,
          [Material Name] AS Material_Name,
          MAX(CAST([Material Code] AS nvarchar(255))) AS Material_Code,
          ROUND(SUM([SetPoint Float]), 2) AS SetPoint,
          ROUND(SUM([Actual Value Float]), 2) AS Actual
        FROM dbo.BatchMaterials
        WHERE [Batch Act End] BETWEEN :begin_time AND :end_time
          AND [SetPoint Float] > 0
          AND CAST([Material Code] AS nvarchar(255)) <> N'0'
          AND [Product Name] IN ({in_clause})
        GROUP BY
          CONVERT(date, [Batch Act End]),
          ISNULL([Product Name], N''),
          ISNULL(FormulaCategoryName, N''),
          [Material Name]
        ORDER BY
          CONVERT(date, [Batch Act End]),
          ISNULL([Product Name], N''),
          ISNULL(FormulaCategoryName, N''),
          [Material Name]
    """
    params = {"begin_time": begin_time, "end_time": end_time, **in_params}
    try:
        rows = _fetch_all(sql, params)
        return jsonify({"data": rows, "beginTime": begin_time.isoformat(), "endTime": end_time.isoformat()}), 200
    except Exception as e:
        logger.exception("raw-material-consumption failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/raw-material-consumption/quantity", methods=["GET"])
@ssrs_bp.route("/ssrs/raw-material-cumulative/quantity", methods=["GET"])
def consumption_quantity():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    sql = """
        SELECT DISTINCT
          Quantity AS Batch_Quantity,
          ROOTGUID,
          [Batch GUID]
        FROM dbo.BatchMaterials
        WHERE [Batch Act End] BETWEEN :begin_time AND :end_time
    """
    try:
        rows = _fetch_all(sql, {"begin_time": begin_time, "end_time": end_time})
        total = sum(float(r.get("Batch_Quantity") or 0) for r in rows)
        return jsonify({"data": rows, "totalQuantity": total}), 200
    except Exception as e:
        logger.exception("consumption quantity failed")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Raw Material Cumulative
# ---------------------------------------------------------------------------
@ssrs_bp.route("/ssrs/raw-material-cumulative/materials", methods=["GET"])
def cumulative_materials_list():
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    # RDL has no date filter on this dropdown dataset
    sql = """
        SELECT DISTINCT [Material Name] AS Material_Name
        FROM dbo.BatchMaterials
        WHERE [Material Name] IS NOT NULL
          AND [Material Name] <> N''
        ORDER BY [Material Name]
    """
    try:
        rows = _fetch_all(sql, {})
        materials = [r["Material_Name"] for r in rows if r.get("Material_Name")]
        return jsonify({"materials": materials}), 200
    except Exception as e:
        logger.exception("cumulative materials list failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/raw-material-cumulative", methods=["GET"])
def raw_material_cumulative():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    materials = _multi("material")
    if not materials:
        return jsonify({"error": "material filter is required (one or more)"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    in_clause, in_params = expand_in("mat", materials)
    sql = f"""
        SELECT
          [Material Name] AS Material_Name,
          MAX(CAST([Material Code] AS nvarchar(255))) AS Material_Code,
          ROUND(SUM([SetPoint Float]), 2) AS SetPoint,
          ROUND(SUM([Actual Value Float]), 2) AS Actual
        FROM dbo.BatchMaterials
        WHERE [Batch Act End] BETWEEN :begin_time AND :end_time
          AND [SetPoint Float] > 0
          AND CAST([Material Code] AS nvarchar(255)) <> N'0'
          AND [Material Name] IN ({in_clause})
        GROUP BY [Material Name]
        ORDER BY [Material Name]
    """
    params = {"begin_time": begin_time, "end_time": end_time, **in_params}
    try:
        rows = _fetch_all(sql, params)
        return jsonify({"data": rows, "beginTime": begin_time.isoformat(), "endTime": end_time.isoformat()}), 200
    except Exception as e:
        logger.exception("raw-material-cumulative failed")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Batch Report (cascading)
# ---------------------------------------------------------------------------
@ssrs_bp.route("/ssrs/batch-report/clients", methods=["GET"])
def batch_clients():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    sql = """
        SELECT DISTINCT ISNULL(FormulaCategoryName, N'') AS OrderCat_Name
        FROM dbo.BatchMaterials
        WHERE [Batch Act Start] BETWEEN :begin_time AND :end_time
          AND lower([Product Name]) != 'not selected'
        ORDER BY OrderCat_Name
    """
    try:
        rows = _fetch_all(sql, {"begin_time": begin_time, "end_time": end_time})
        clients = [
            r["OrderCat_Name"]
            for r in rows
            if r.get("OrderCat_Name") is not None and str(r.get("OrderCat_Name")).strip() != ""
        ]
        return jsonify({"clients": clients}), 200
    except Exception as e:
        logger.exception("batch clients failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/batch-report/recipes", methods=["GET"])
def batch_recipes():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    clients = _multi("clients") or _multi("client")
    if not clients:
        return jsonify({"error": "clients filter is required"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    in_clause, in_params = expand_in("cli", clients)
    sql = f"""
        SELECT DISTINCT
          [Batch GUID] AS Batch_RecpGUID,
          [Product Name] AS Batch_RecpName
        FROM dbo.BatchMaterials
        WHERE ISNULL(FormulaCategoryName, N'') IN ({in_clause})
          AND [Batch Act Start] BETWEEN :begin_time AND :end_time
          AND lower([Product Name]) != 'not selected'
        ORDER BY [Product Name]
    """
    params = {"begin_time": begin_time, "end_time": end_time, **in_params}
    try:
        rows = _fetch_all(sql, params)
        return jsonify({"recipes": rows}), 200
    except Exception as e:
        logger.exception("batch recipes failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/batch-report/batches", methods=["GET"])
def batch_batches():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    clients = _multi("clients") or _multi("client")
    recipes = _multi("recipe")
    if not clients or not recipes:
        return jsonify({"error": "clients and recipe filters are required"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    cli_clause, cli_params = expand_in("cli", clients)
    rec_clause, rec_params = expand_in("rec", recipes)
    # One row per [Batch GUID] (sub-batches /01-/06 are separate), same as calendar
    sql = f"""
        SELECT DISTINCT
          [Batch GUID] AS Batch_OGUID,
          ROOTGUID AS Batch_RootGUID,
          [Batch Name] AS Batch_Name
        FROM dbo.BatchMaterials
        WHERE ISNULL(FormulaCategoryName, N'') IN ({cli_clause})
          AND [Product Name] IN ({rec_clause})
          AND [Batch Act Start] BETWEEN :begin_time AND :end_time
          AND lower([Product Name]) != 'not selected'
        ORDER BY [Batch Name]
    """
    params = {"begin_time": begin_time, "end_time": end_time, **cli_params, **rec_params}
    try:
        rows = _fetch_all(sql, params)
        return jsonify({"batches": rows}), 200
    except Exception as e:
        logger.exception("batch batches failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/batch-report", methods=["GET"])
def batch_report():
    _, _, begin_time, end_time, err = _parse_range()
    if err:
        return err
    clients = _multi("clients") or _multi("client")
    batches = _multi("batch")
    if not clients or not batches:
        return jsonify({"error": "clients and batch ([Batch GUID]) filters are required"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    cli_clause, cli_params = expand_in("cli", clients)
    bat_clause, bat_params = expand_in("bat", batches)
    sql = f"""
        SELECT
          ISNULL(FormulaCategoryName, N'') AS OrderCat_Name,
          [Batch Name] AS Batch_Name,
          [Batch GUID] AS Batch_OGUID,
          ROOTGUID AS Batch_RootGUID,
          [Batch Act End] AS Batch_ActEnd,
          [Batch Act Start] AS Batch_ActStart,
          [Material Name] AS Material_Name,
          [Material Code] AS Material_Code,
          ROUND([SetPoint Float], 2) AS SetPoint,
          ROUND([Actual Value Float], 2) AS Actual,
          ROUND(([Actual Value Float] - [SetPoint Float]), 2) AS Diffrence,
          DATEADD(HOUR, 3, [Batch Act Start]) AS BatchTime
        FROM dbo.BatchMaterials
        WHERE ISNULL(FormulaCategoryName, N'') IN ({cli_clause})
          AND [Batch GUID] IN ({bat_clause})
          AND [Batch Act Start] BETWEEN :begin_time AND :end_time
          AND lower([Product Name]) != 'not selected'
          AND [SetPoint Float] > 0
    """
    params = {"begin_time": begin_time, "end_time": end_time, **cli_params, **bat_params}
    try:
        rows = _fetch_all(sql, params)
        return jsonify({"data": rows, "beginTime": begin_time.isoformat(), "endTime": end_time.isoformat()}), 200
    except Exception as e:
        logger.exception("batch-report failed")
        return jsonify({"error": str(e)}), 500


@ssrs_bp.route("/ssrs/batch-report/assign-client", methods=["POST"])
def assign_batch_client():
    """Move material rows for one or more batches ([Batch GUID]) to a FormulaCategoryName client."""
    data = request.get_json(silent=True) or {}
    new_client = str(data.get("newClient") or data.get("new_client") or "").strip()
    raw_guids = data.get("batchGuids") or data.get("batch_guids")
    if isinstance(raw_guids, list):
        batch_guids = [str(g).strip() for g in raw_guids if str(g).strip()]
    else:
        single = str(data.get("batchGuid") or data.get("batch_guid") or "").strip()
        batch_guids = [single] if single else []
    # de-dupe while preserving order
    seen = set()
    unique_guids = []
    for g in batch_guids:
        key = g.lower()
        if key in seen:
            continue
        seen.add(key)
        unique_guids.append(g)
    batch_guids = unique_guids

    if not batch_guids or not new_client:
        return jsonify({"error": "batchGuid/batchGuids and newClient are required"}), 400
    engine, eng_err = _require_engine()
    if eng_err:
        return eng_err
    try:
        results = []
        total_updated = 0
        with engine.begin() as conn:
            for batch_guid in batch_guids:
                current = conn.execute(
                    text(
                        """
                        SELECT TOP 1
                          ISNULL(FormulaCategoryName, N'') AS OrderCat_Name,
                          ISNULL([Batch Name], N'') AS Batch_Name
                        FROM dbo.BatchMaterials
                        WHERE [Batch GUID] = CAST(:batch_guid AS uniqueidentifier)
                        """
                    ),
                    {"batch_guid": batch_guid},
                ).mappings().first()
                if not current:
                    results.append(
                        {
                            "batchGuid": batch_guid,
                            "updated": 0,
                            "error": "Batch not found",
                        }
                    )
                    continue
                old_client = str(current.get("OrderCat_Name") or "").strip()
                batch_name = str(current.get("Batch_Name") or "").strip()
                if old_client == new_client:
                    results.append(
                        {
                            "batchGuid": batch_guid,
                            "batchName": batch_name,
                            "oldClient": old_client,
                            "newClient": new_client,
                            "updated": 0,
                            "message": "Batch is already assigned to this client",
                        }
                    )
                    continue
                result = conn.execute(
                    text(
                        """
                        UPDATE dbo.BatchMaterials
                        SET FormulaCategoryName = :new_client
                        WHERE [Batch GUID] = CAST(:batch_guid AS uniqueidentifier)
                        """
                    ),
                    {"new_client": new_client, "batch_guid": batch_guid},
                )
                updated = int(result.rowcount or 0)
                total_updated += updated
                results.append(
                    {
                        "batchGuid": batch_guid,
                        "batchName": batch_name,
                        "oldClient": old_client,
                        "newClient": new_client,
                        "updated": updated,
                    }
                )
                logger.info(
                    "Assigned batch %s (%s) from %s to %s (%s rows)",
                    batch_guid,
                    batch_name,
                    old_client,
                    new_client,
                    updated,
                )

        moved = [r for r in results if int(r.get("updated") or 0) > 0]
        skipped = [r for r in results if int(r.get("updated") or 0) == 0]
        # Backward-compatible single-batch shape when only one GUID was sent
        if len(batch_guids) == 1:
            one = results[0]
            if one.get("error") == "Batch not found":
                return jsonify({"error": "Batch not found"}), 404
            return jsonify(
                {
                    "updated": int(one.get("updated") or 0),
                    "batchGuid": one.get("batchGuid"),
                    "batchName": one.get("batchName"),
                    "oldClient": one.get("oldClient"),
                    "newClient": new_client,
                    "message": one.get("message"),
                    "results": results,
                    "movedCount": len(moved),
                    "skippedCount": len(skipped),
                }
            ), 200

        return jsonify(
            {
                "updated": total_updated,
                "newClient": new_client,
                "results": results,
                "movedCount": len(moved),
                "skippedCount": len(skipped),
                "message": (
                    f"Moved {len(moved)} batch(es) to {new_client}"
                    if moved
                    else "No batches updated"
                ),
            }
        ), 200
    except Exception as e:
        logger.exception("assign batch client failed")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Save exported Excel into F:\Purebreed_reports\{report_folder}\
# ---------------------------------------------------------------------------
REPORT_EXPORT_ROOT = os.environ.get("REPORT_EXPORT_ROOT", r"F:\Purebreed_reports")

REPORT_FOLDER_MAP = {
    "Feed Production": "feed_report",
    "Raw Material Consumption": "raw_materail_consumtion",
    "Raw Material Cumulative": "raw_materail_cumative",
    "Batch Report": "batch_report",
}


@ssrs_bp.route("/ssrs/export/save", methods=["POST"])
def save_report_export():
    """Save an uploaded Excel export into the matching Purebreed_reports subfolder."""
    report_type = (
        str(request.form.get("reportType") or request.form.get("report_type") or "").strip()
        or str((request.get_json(silent=True) or {}).get("reportType") or "").strip()
    )
    folder = REPORT_FOLDER_MAP.get(report_type)
    if not folder:
        return jsonify(
            {
                "error": f"Unknown report type: {report_type or '(empty)'}",
                "allowed": list(REPORT_FOLDER_MAP.keys()),
            }
        ), 400

    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "file is required"}), 400

    raw_name = str(request.form.get("fileName") or upload.filename or "report.xlsx")
    safe_name = os.path.basename(raw_name).replace("..", "_")
    if not safe_name.lower().endswith(".xlsx"):
        safe_name = f"{safe_name}.xlsx"

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base, ext = os.path.splitext(safe_name)
    final_name = f"{base}_{stamp}{ext or '.xlsx'}"

    dest_dir = os.path.join(REPORT_EXPORT_ROOT, folder)
    try:
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, final_name)
        upload.save(dest_path)
        logger.info("Saved report export to %s", dest_path)
        return jsonify(
            {
                "ok": True,
                "path": dest_path,
                "folder": folder,
                "fileName": final_name,
                "reportType": report_type,
            }
        ), 200
    except Exception as e:
        logger.exception("save report export failed")
        return jsonify(
            {
                "error": str(e),
                "hint": f"Ensure folder exists and is writable: {dest_dir}",
            }
        ), 500


# ---------------------------------------------------------------------------
# PM1 / CL Temp — ignored (no PM1Data in Hercules)
# ---------------------------------------------------------------------------
@ssrs_bp.route("/ssrs/pm1-data", methods=["GET"])
def pm1_data():
    mode = (request.args.get("mode") or "summary").lower()
    return jsonify({
        "data": [],
        "mode": mode,
        "note": "CL Temp / PM1Data is not used. Historical reports read BatchMaterials only.",
    }), 200
