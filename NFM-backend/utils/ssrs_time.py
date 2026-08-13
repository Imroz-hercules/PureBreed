"""SSRS-style BeginTime / EndTime helpers.

RDL default expressions (local plant timezone → UTC):
  BeginTime = ToUniversalTime(BeginDate + beginHour hours)  # default hour 7
  EndTime   = ToUniversalTime(EndDate   + endHour hours)    # default hour 23

We treat plant local as Asia/Riyadh (UTC+3, no DST), matching Saudi sites.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Iterable, List, Optional, Tuple

RIYADH = timezone(timedelta(hours=3))
UTC = timezone.utc


def parse_date(value: str) -> date:
    raw = (value or "").strip().replace("Z", "")
    if "T" in raw:
        return datetime.fromisoformat(raw).date()
    return datetime.strptime(raw[:10], "%Y-%m-%d").date()


def to_ssrs_utc(
    day: date,
    hour: int,
) -> datetime:
    """Local calendar date + hour → naive UTC datetime (as stored/compared in SSRS)."""
    local = datetime(day.year, day.month, day.day, hour, 0, 0, tzinfo=RIYADH)
    return local.astimezone(UTC).replace(tzinfo=None)


def begin_end_times(
    begin_date: date,
    end_date: date,
    begin_hour: int = 7,
    end_hour: int = 23,
) -> Tuple[datetime, datetime]:
    return to_ssrs_utc(begin_date, begin_hour), to_ssrs_utc(end_date, end_hour)


def parse_multi(value: Optional[str], repeated: Optional[Iterable[str]] = None) -> List[str]:
    """Merge repeated query args and/or comma-separated values."""
    items: List[str] = []
    if repeated:
        for v in repeated:
            if v is None:
                continue
            items.extend(x.strip() for x in str(v).split(",") if x.strip())
    elif value:
        items.extend(x.strip() for x in value.split(",") if x.strip())
    # de-dupe preserving order
    seen = set()
    out: List[str] = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def expand_in(prefix: str, values: List[str]) -> Tuple[str, dict]:
    """Build `(:p_0, :p_1, …)` and param dict for SQLAlchemy text()."""
    if not values:
        raise ValueError(f"{prefix} requires at least one value")
    placeholders = []
    params = {}
    for i, v in enumerate(values):
        key = f"{prefix}_{i}"
        placeholders.append(f":{key}")
        params[key] = v
    return ", ".join(placeholders), params
