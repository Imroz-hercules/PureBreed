import pandas as pd
import sys
import os
from pathlib import Path
import math
from sqlalchemy.exc import SQLAlchemyError

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, db
from models.kpi_material import KPIMaterial

CSV_FILE_PATH = Path("C:/Users/User/Kpi_Final_Version-main (1)/last_1000.csv")

def sanitize(value):
    if pd.isna(value) or str(value).lower() == 'nan':
        return None
    return value

def insert_csv_data():
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        df = df.where(pd.notnull(df), None)

        # Normalize column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace(r'[^a-zA-Z0-9_]', '', regex=True)
        print("📋 Columns found:", df.columns.tolist())

        with app.app_context():
            success_count = 0
            failed_rows = 0

            for index, row in df.iterrows():
                if row.isnull().all():
                    print(f"⚠️ Skipping empty row {index}")
                    continue

                try:
                    kpi_material = KPIMaterial(
                        batch_guid=sanitize(row.get('batch_guid')),
                        batch_name=sanitize(row.get('batch_name')),
                        product_name=sanitize(row.get('product_name')),
                        batch_act_start=sanitize(row.get('batch_act_start')),
                        batch_act_end=sanitize(row.get('batch_act_end')),
                        quantity=sanitize(row.get('quantity')),
                        material_name=sanitize(row.get('material_name')),
                        material_code=sanitize(row.get('material_code')),
                        setpoint_float=sanitize(row.get('setpoint_float')),
                        actual_value_float=sanitize(row.get('actual_value_float')),
                        source_server=sanitize(row.get('source_server')),
                        rootguid=sanitize(row.get('rootguid')),
                        order_id=sanitize(row.get('orderid')),
                        event_id=sanitize(row.get('eventid')),
                        batch_transfer_time=sanitize(row.get('batch_transfer_time')),
                        formula_category_name=sanitize(row.get('formulacategoryname')),
                    )

                    db.session.add(kpi_material)
                    success_count += 1

                except Exception as e:
                    print(f"❌ Error processing row {index}: {e}")
                    failed_rows += 1

            try:
                db.session.commit()
                print(f"✅ Data inserted: {success_count} rows.")
                if failed_rows:
                    print(f"⚠️ Failed to process {failed_rows} row(s).")
            except SQLAlchemyError as db_err:
                db.session.rollback()
                print("❌ Database commit failed:", db_err)

    except FileNotFoundError:
        print(f"❌ CSV file not found at: {CSV_FILE_PATH}")
    except pd.errors.ParserError as parse_err:
        print("❌ Error parsing CSV file:", parse_err)

if __name__ == "__main__":
    insert_csv_data()
