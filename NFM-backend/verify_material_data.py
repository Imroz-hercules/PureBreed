#!/usr/bin/env python3
"""
Material Data Verification Script
Checks for PAM Oil and PAM Oil Tone data in database for 2025-2026
Run from NFM-backend directory: python verify_material_data.py
"""

import sys
import os
from datetime import datetime
from sqlalchemy import func, or_
from flask import Flask

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from extensions import db
from models.kpi_material import KPIMaterial

def verify_material_data():
    """Verify PAM Oil and PAM Oil Tone data for 2025-2026"""
    
    # Create a minimal Flask app for database access
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        # Date range: Jan 1, 2025 7:00 AM to Jan 1, 2026 7:00 AM
        start_date = datetime(2025, 1, 1, 7, 0, 0)
        end_date = datetime(2026, 1, 1, 7, 0, 0)
        
        print("=" * 80)
        print("MATERIAL DATA VERIFICATION FOR 2025-2026")
        print("=" * 80)
        print(f"Date Range: {start_date} to {end_date}")
        print(f"Materials to check: 'PAM Oil' and 'PAM Oil Tone'")
        print("=" * 80)
        print()
        
        try:
            # Query for PAM Oil (case-insensitive search, excluding "tone" variants)
            print("Querying PAM Oil data...")
            pam_oil_query = KPIMaterial.query.filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%pam oil%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil%')
                ),
                ~func.lower(KPIMaterial.material_name).like('%tone%'),
                ~func.lower(KPIMaterial.material_name).like('%ton%'),
                func.lower(KPIMaterial.product_name) != 'not selected'
            )
            
            pam_oil_count = pam_oil_query.count()
            pam_oil_records = pam_oil_query.limit(10).all()
            
            # Query for PAM Oil Tone (case-insensitive search)
            print("Querying PAM Oil Tone data...")
            pam_oil_tone_query = KPIMaterial.query.filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%pam oil tone%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil tone%'),
                    func.lower(KPIMaterial.material_name).like('%pam oil ton%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil ton%')
                ),
                func.lower(KPIMaterial.product_name) != 'not selected'
            )
            
            pam_oil_tone_count = pam_oil_tone_query.count()
            pam_oil_tone_records = pam_oil_tone_query.limit(10).all()
            
            # Get aggregated statistics for PAM Oil
            print("Calculating PAM Oil statistics...")
            pam_oil_stats = db.session.query(
                func.count(KPIMaterial.id).label('total_records'),
                func.sum(KPIMaterial.setpoint_float).label('total_planned'),
                func.sum(KPIMaterial.actual_value_float).label('total_actual'),
                func.avg(KPIMaterial.setpoint_float).label('avg_planned'),
                func.avg(KPIMaterial.actual_value_float).label('avg_actual')
            ).filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%pam oil%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil%')
                ),
                ~func.lower(KPIMaterial.material_name).like('%tone%'),
                ~func.lower(KPIMaterial.material_name).like('%ton%'),
                func.lower(KPIMaterial.product_name) != 'not selected'
            ).first()
            
            # Get aggregated statistics for PAM Oil Tone
            print("Calculating PAM Oil Tone statistics...")
            pam_oil_tone_stats = db.session.query(
                func.count(KPIMaterial.id).label('total_records'),
                func.sum(KPIMaterial.setpoint_float).label('total_planned'),
                func.sum(KPIMaterial.actual_value_float).label('total_actual'),
                func.avg(KPIMaterial.setpoint_float).label('avg_planned'),
                func.avg(KPIMaterial.actual_value_float).label('avg_actual')
            ).filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%pam oil tone%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil tone%'),
                    func.lower(KPIMaterial.material_name).like('%pam oil ton%'),
                    func.lower(KPIMaterial.material_name).like('%palm oil ton%')
                ),
                func.lower(KPIMaterial.product_name) != 'not selected'
            ).first()
            
            # Print PAM Oil results
            print("\n" + "=" * 80)
            print("PAM OIL RESULTS")
            print("-" * 80)
            print(f"Total Records: {pam_oil_count}")
            
            if pam_oil_stats and pam_oil_stats.total_records > 0:
                print(f"Total Planned (KG): {pam_oil_stats.total_planned or 0:.2f}")
                print(f"Total Actual (KG): {pam_oil_stats.total_actual or 0:.2f}")
                print(f"Average Planned (KG): {pam_oil_stats.avg_planned or 0:.2f}")
                print(f"Average Actual (KG): {pam_oil_stats.avg_actual or 0:.2f}")
            else:
                print("No statistics available (no records found)")
            
            print(f"\nSample Records (showing first 10):")
            if pam_oil_records:
                unique_materials = set()
                for i, record in enumerate(pam_oil_records, 1):
                    unique_materials.add(record.material_name)
                    print(f"  {i}. Material: {record.material_name}")
                    print(f"     Code: {record.material_code}")
                    print(f"     Batch: {record.batch_name}")
                    print(f"     Product: {record.product_name}")
                    print(f"     Date: {record.batch_act_start}")
                    print(f"     Planned: {record.setpoint_float or 0:.2f} KG")
                    print(f"     Actual: {record.actual_value_float or 0:.2f} KG")
                    print()
                print(f"Unique material names found: {', '.join(sorted(unique_materials))}")
            else:
                print("  [X] No records found")
            
            # Print PAM Oil Tone results
            print("\n" + "=" * 80)
            print("PAM OIL TONE RESULTS")
            print("-" * 80)
            print(f"Total Records: {pam_oil_tone_count}")
            
            if pam_oil_tone_stats and pam_oil_tone_stats.total_records > 0:
                print(f"Total Planned (KG): {pam_oil_tone_stats.total_planned or 0:.2f}")
                print(f"Total Actual (KG): {pam_oil_tone_stats.total_actual or 0:.2f}")
                print(f"Average Planned (KG): {pam_oil_tone_stats.avg_planned or 0:.2f}")
                print(f"Average Actual (KG): {pam_oil_tone_stats.avg_actual or 0:.2f}")
            else:
                print("No statistics available (no records found)")
            
            print(f"\nSample Records (showing first 10):")
            if pam_oil_tone_records:
                unique_materials = set()
                for i, record in enumerate(pam_oil_tone_records, 1):
                    unique_materials.add(record.material_name)
                    print(f"  {i}. Material: {record.material_name}")
                    print(f"     Code: {record.material_code}")
                    print(f"     Batch: {record.batch_name}")
                    print(f"     Product: {record.product_name}")
                    print(f"     Date: {record.batch_act_start}")
                    print(f"     Planned: {record.setpoint_float or 0:.2f} KG")
                    print(f"     Actual: {record.actual_value_float or 0:.2f} KG")
                    print()
                print(f"Unique material names found: {', '.join(sorted(unique_materials))}")
            else:
                print("  [X] No records found")
            
            # Check for similar material names
            print("\n" + "=" * 80)
            print("CHECKING FOR SIMILAR MATERIAL NAMES")
            print("-" * 80)
            similar_materials = db.session.query(
                KPIMaterial.material_name,
                func.count(KPIMaterial.id).label('count')
            ).filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%pam%'),
                    func.lower(KPIMaterial.material_name).like('%palm%')
                ),
                func.lower(KPIMaterial.product_name) != 'not selected'
            ).group_by(KPIMaterial.material_name).order_by(func.count(KPIMaterial.id).desc()).limit(20).all()
            
            print("Materials containing 'pam' or 'palm' in the date range:")
            if similar_materials:
                for material, count in similar_materials:
                    print(f"  - {material}: {count} records")
            else:
                print("  [X] No materials found")
            
            # Summary
            print("\n" + "=" * 80)
            print("SUMMARY")
            print("-" * 80)
            print(f"PAM Oil records: {pam_oil_count}")
            print(f"PAM Oil Tone records: {pam_oil_tone_count}")
            print(f"Total PAM-related records: {pam_oil_count + pam_oil_tone_count}")
            
            if pam_oil_count == 0 and pam_oil_tone_count == 0:
                print("\n[!] WARNING: No PAM Oil or PAM Oil Tone records found in the date range!")
                print("   This could explain why the Material Consumption Report is empty.")
                print("   Possible reasons:")
                print("   1. No data exists in database for this date range")
                print("   2. Material names might be spelled differently")
                print("   3. Date filtering might be excluding the data")
            elif pam_oil_count > 0 or pam_oil_tone_count > 0:
                print("\n[OK] Data exists in the database for these materials.")
                print("   If the report is still empty, check the frontend filtering logic.")
            
            print("=" * 80)
            
        except Exception as e:
            print(f"\n[ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            return 1
    
    return 0

if __name__ == "__main__":
    exit_code = verify_material_data()
    sys.exit(exit_code)

