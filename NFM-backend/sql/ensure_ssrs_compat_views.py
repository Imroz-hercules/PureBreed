"""
OPTIONAL / unused by the live app.

Historical reports now query dbo.BatchMaterials directly
(see routes/ssrs_reports.py). This script only exists if you still want
MaterialInfo / ConsumptionInfo views for old RDL files.

Maps dbo.BatchMaterials → dbo.MaterialInfo / dbo.ConsumptionInfo
so /api/ssrs/* RDL-style SQL keeps working.

PM1Data is intentionally not created (CL Temp ignored).

Safe to re-run. Does not replace a real base table named MaterialInfo.
"""
from sqlalchemy import create_engine, text
import os

DEFAULT_URI = (
    r"mssql+pyodbc://SERVER1\BREED_REPORTING/Hercules"
    "?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
)

URI = os.getenv("SSRS_DATABASE_URI", DEFAULT_URI)

SOURCE = "dbo.BatchMaterials"

MATERIALINFO_VIEW = f"""
CREATE VIEW dbo.MaterialInfo AS
SELECT
  ISNULL(bm.FormulaCategoryName, N'') AS OrderCat_Name,
  bm.[Batch Act End] AS Batch_ActEnd,
  bm.[Batch Name] AS Batch_RecpName,
  bm.[Product Name] AS Batch_FormulaName,
  bm.Quantity AS Batch_Quantity,
  bm.[Material Name] AS OnlinePar_sp_matname,
  bm.[Material Code] AS OnlinePar_sp_matcode,
  bm.[SetPoint Float] AS OnlinePar_sp_float,
  bm.[Actual Value Float] AS OnlinePar_av_float,
  bm.ROOTGUID AS ROOTGUID,
  bm.[Batch Name] AS Batch_Name,
  bm.[Batch GUID] AS Batch_RecpGUID
FROM {SOURCE} AS bm
"""

CONSUMPTIONINFO_VIEW = f"""
CREATE VIEW dbo.ConsumptionInfo AS
SELECT DISTINCT
  bm.[Batch Act End] AS Batch_ActEnd,
  bm.Quantity AS Batch_Quantity,
  bm.ROOTGUID AS Batch_OGUID,
  bm.[Batch GUID] AS Batch_RecpGUID
FROM {SOURCE} AS bm
WHERE bm.[Batch Act End] IS NOT NULL
"""


def table_or_view_exists(conn, name: str) -> bool:
    row = conn.execute(
        text(
            "SELECT 1 FROM INFORMATION_SCHEMA.TABLES "
            "WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=:n"
        ),
        {"n": name},
    ).fetchone()
    return row is not None


def is_view(conn, name: str) -> bool:
    row = conn.execute(
        text(
            "SELECT 1 FROM INFORMATION_SCHEMA.VIEWS "
            "WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=:n"
        ),
        {"n": name},
    ).fetchone()
    return row is not None


def ensure_view(conn, name: str, ddl: str) -> str:
    if table_or_view_exists(conn, name):
        if is_view(conn, name):
            conn.execute(text(f"DROP VIEW dbo.[{name}]"))
            conn.execute(text(ddl))
            return f"recreated view dbo.{name}"
        return f"skipped dbo.{name} (base table exists — not overwriting)"
    conn.execute(text(ddl))
    return f"created view dbo.{name}"


def main():
    print("Connecting:", URI.split("?")[0])
    print("Source table:", SOURCE)
    engine = create_engine(URI)
    with engine.begin() as conn:
        if not table_or_view_exists(conn, "BatchMaterials"):
            raise SystemExit("dbo.BatchMaterials not found — aborting")
        print(ensure_view(conn, "MaterialInfo", MATERIALINFO_VIEW))
        print(ensure_view(conn, "ConsumptionInfo", CONSUMPTIONINFO_VIEW))
        n = conn.execute(text("SELECT COUNT(*) FROM dbo.MaterialInfo")).scalar()
        print(f"MaterialInfo rows visible: {n}")
    print("Done. (PM1Data skipped — CL Temp ignored)")


if __name__ == "__main__":
    main()
