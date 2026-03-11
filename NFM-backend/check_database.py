#!/usr/bin/env python3
"""
Check the current state of the PLC live data database
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from extensions import db
from config import Config
from app import app
from sqlalchemy import text

def check_database():
    """Check the current database state"""
    print("📊 Checking PLC Live Data Database")
    print("=" * 50)
    
    try:
        with app.app_context():
            postgres_engine = db.get_engine(bind='postgresql')
            
            with postgres_engine.connect() as conn:
                # Get total count
                result = conn.execute(text("SELECT COUNT(*) FROM public.plc_live_data"))
                count = result.fetchone()[0]
                print(f"📈 Total records: {count}")
                
                # Get latest 5 records
                latest_result = conn.execute(text("""
                    SELECT id, timestamp, pellet1_ton_hr, pellet2_ton_hr, pellet3_ton_hr, 
                           pellet1_kw_ton, pellet2_kw_ton, pellet3_kw_ton, 
                           pellet1_temp, pellet2_temp, pellet3_temp
                    FROM public.plc_live_data 
                    ORDER BY timestamp DESC 
                    LIMIT 5
                """))
                
                print(f"\n📋 Latest {min(5, count)} records:")
                print("-" * 80)
                print(f"{'ID':<3} {'Timestamp':<20} {'P1_TonHr':<8} {'P2_TonHr':<8} {'P3_TonHr':<10} {'P1_KwTon':<8} {'P1_Temp':<8}")
                print("-" * 80)
                
                for row in latest_result:
                    print(f"{row[0]:<3} {str(row[1])[:19]:<20} {row[2]:<8.2f} {row[3]:<8.2f} {row[4]:<10.2f} {row[5]:<8.2f} {row[8]:<8.1f}")
                
                # Check if data is being inserted recently
                recent_result = conn.execute(text("""
                    SELECT COUNT(*) FROM public.plc_live_data 
                    WHERE timestamp > NOW() - INTERVAL '5 minutes'
                """))
                recent_count = recent_result.fetchone()[0]
                
                print(f"\n⏰ Records in last 5 minutes: {recent_count}")
                
                if recent_count > 0:
                    print("✅ Data is being inserted recently!")
                else:
                    print("⚠️ No recent data - check if live stream is running")
                
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database()
