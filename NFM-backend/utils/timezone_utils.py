"""Saudi Arabia (AST, UTC+3) timezone helpers for batch reporting."""
import re
from datetime import datetime, timedelta, timezone

SAUDI_OFFSET = timedelta(hours=3)


def saudi_to_utc(dt):
    """Saudi local time -> naive UTC for DB queries."""
    if not dt:
        return dt
    return dt - SAUDI_OFFSET


def utc_to_saudi(dt):
    """Naive UTC from DB -> Saudi local time."""
    if not dt:
        return dt
    return dt + SAUDI_OFFSET


def _to_naive_utc(dt):
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def parse_filter_date(date_str):
    """Parse client filter date to naive UTC for DB queries.

    ISO strings with Z/offset are already UTC (browser toISOString).
    Naive strings are interpreted as Saudi local time.
    """
    if not date_str:
        raise ValueError("Date string is required")

    if "Z" in date_str or date_str.endswith("+00:00") or (
        len(date_str) >= 6 and date_str[-6] in "+-" and ":" in date_str[-5:]
    ):
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return _to_naive_utc(dt)

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return saudi_to_utc(datetime.strptime(date_str, fmt))
        except ValueError:
            continue

    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    if dt.tzinfo is not None:
        return _to_naive_utc(dt)
    return saudi_to_utc(dt)


def parse_filter_end_date(date_str):
    """Like parse_filter_date, but date-only values include the full Saudi day."""
    if date_str and re.match(r"^\d{4}-\d{2}-\d{2}$", date_str.strip()):
        end_of_day = datetime.strptime(date_str.strip(), "%Y-%m-%d").replace(
            hour=23, minute=59, second=59
        )
        return saudi_to_utc(end_of_day)
    return parse_filter_date(date_str)


def format_saudi_datetime(dt):
    if not dt:
        return None
    return utc_to_saudi(dt).strftime("%Y-%m-%d %H:%M:%S")


def serialize_kpi_material(mat, include_event_id=False):
    data = {
        "Batch GUID": str(mat.batch_guid) if mat.batch_guid is not None else None,
        "Batch Name": mat.batch_name,
        "Product Name": mat.product_name,
        "Batch Act Start": format_saudi_datetime(mat.batch_act_start),
        "Batch Act End": format_saudi_datetime(mat.batch_act_end),
        "Quantity": mat.quantity,
        "Material Name": mat.material_name,
        "Material Code": mat.material_code,
        "SetPoint Float": mat.setpoint_float,
        "Actual Value Float": mat.actual_value_float,
        "Source Server": mat.source_server,
        "ROOTGUID": str(mat.rootguid) if mat.rootguid is not None else None,
        "OrderId": mat.order_id,
        "Batch Transfer Time": format_saudi_datetime(mat.batch_transfer_time),
        "FormulaCategoryName": mat.formula_category_name,
    }
    if include_event_id:
        data["EventID"] = (
            f"{str(mat.batch_guid) if mat.batch_guid else ''}_{mat.order_id}_{mat.material_name or ''}"
            if (mat.batch_guid or mat.material_name)
            else None
        )
    return data
