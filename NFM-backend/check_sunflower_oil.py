#!/usr/bin/env python3
"""
Check for Sunflower Oil data in database
Run from NFM-backend directory: python check_sunflower_oil.py
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

def check_sunflower_oil():
    """Check for Sunflower Oil data in database"""
    
    # Create a minimal Flask app for database access
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        # Date range: Jan 1, 2025 7:00 AM to Jan 1, 2026 7:00 AM
        start_date = datetime(2025, 1, 1, 7, 0, 0)
        end_date = datetime(2026, 1, 1, 7, 0, 0)
        
        print("=" * 80)
        print("CHECKING FOR SUNFLOWER OIL DATA IN DATABASE")
        print("=" * 80)
        print(f"Date Range: {start_date} to {end_date}")
        print("=" * 80)
        print()
        
        try:
            # Search for any materials containing "sunflower" (case-insensitive)
            print("Searching for materials containing 'sunflower'...")
            sunflower_query = KPIMaterial.query.filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                func.lower(KPIMaterial.material_name).like('%sunflower%'),
                func.lower(KPIMaterial.product_name) != 'not selected'
            )
            
            sunflower_records = sunflower_query.all()
            print(f"Found {len(sunflower_records)} records with 'sunflower' in name")
            
            if sunflower_records:
                # Get unique material names
                unique_names = set()
                for record in sunflower_records:
                    unique_names.add(record.material_name)
                
                print(f"\nUnique material names found:")
                for name in sorted(unique_names):
                    count = len([r for r in sunflower_records if r.material_name == name])
                    print(f"  - {name}: {count} records")
                
                # Show sample records
                print(f"\nSample records (first 10):")
                for i, record in enumerate(sunflower_records[:10], 1):
                    print(f"  {i}. Material: {record.material_name}")
                    print(f"     Code: {record.material_code}")
                    print(f"     Batch: {record.batch_name}")
                    print(f"     Date: {record.batch_act_start}")
                    print(f"     Planned: {record.setpoint_float or 0:.2f} KG")
                    print(f"     Actual: {record.actual_value_float or 0:.2f} KG")
                    print()
            else:
                print("[X] No records found with 'sunflower' in material name")
            
            # Also check for variations like "sun flower", "sun-flower", etc.
            print("\n" + "=" * 80)
            print("CHECKING FOR VARIATIONS (sun flower, sun-flower, etc.)")
            print("=" * 80)
            
            variations_query = KPIMaterial.query.filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                or_(
                    func.lower(KPIMaterial.material_name).like('%sun flower%'),
                    func.lower(KPIMaterial.material_name).like('%sun-flower%'),
                    func.lower(KPIMaterial.material_name).like('%sunflower%')
                ),
                func.lower(KPIMaterial.product_name) != 'not selected'
            )
            
            variations_records = variations_query.all()
            print(f"Found {len(variations_records)} records with variations")
            
            if variations_records:
                unique_names = set()
                for record in variations_records:
                    unique_names.add(record.material_name)
                
                print(f"\nUnique material names found:")
                for name in sorted(unique_names):
                    count = len([r for r in variations_records if r.material_name == name])
                    print(f"  - {name}: {count} records")
            
            # Check all unique material names containing "oil" to see if sunflower is named differently
            print("\n" + "=" * 80)
            print("CHECKING ALL MATERIALS CONTAINING 'OIL' IN NAME")
            print("=" * 80)
            
            all_oils_query = KPIMaterial.query.filter(
                KPIMaterial.batch_act_start >= start_date,
                KPIMaterial.batch_act_start <= end_date,
                func.lower(KPIMaterial.material_name).like('%oil%'),
                func.lower(KPIMaterial.product_name) != 'not selected'
            )
            
            all_oils = all_oils_query.all()
            unique_oil_names = set()
            for record in all_oils:
                unique_oil_names.add(record.material_name)
            
            print(f"Found {len(unique_oil_names)} unique materials containing 'oil':")
            for name in sorted(unique_oil_names):
                count = len([r for r in all_oils if r.material_name == name])
                print(f"  - {name}: {count} records")
            
            print("=" * 80)
            return 0
            
        except Exception as e:
            print(f"\n[ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            return 1

if __name__ == "__main__":
    exit_code = check_sunflower_oil()
    sys.exit(exit_code)


