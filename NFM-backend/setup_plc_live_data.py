#!/usr/bin/env python3
"""
Setup script for PLC Live Data PostgreSQL table
This script will:
1. Create the PostgreSQL table if it doesn't exist
2. Test the database connection
3. Test PLC data insertion
"""

import os
import sys
from sqlalchemy import create_engine, text
from config import Config

def create_postgresql_table():
    """Create the PLC live data table in PostgreSQL"""
    try:
        # Connect to PostgreSQL using the bind configuration
        postgres_engine = create_engine(Config.SQLALCHEMY_BINDS['postgresql'])
        
        with postgres_engine.connect() as conn:
            # Create table if it doesn't exist
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS public.plc_live_data (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                
                -- DB4 - Pellet Production Data
                pellet1_ton_hr FLOAT,
                pellet2_ton_hr FLOAT,
                pellet3_ton_hr FLOAT,
                pellet1_kw_ton FLOAT,
                pellet2_kw_ton FLOAT,
                pellet3_kw_ton FLOAT,
                pellet1_temp FLOAT,
                pellet2_temp FLOAT,
                pellet3_temp FLOAT
            );
            """
            
            conn.execute(text(create_table_sql))
            conn.commit()
            
            # Create indexes
            index_sql = """
            CREATE INDEX IF NOT EXISTS idx_plc_live_data_timestamp 
            ON public.plc_live_data(timestamp DESC);
            
            CREATE INDEX IF NOT EXISTS idx_plc_live_data_id 
            ON public.plc_live_data(id DESC);
            """
            
            conn.execute(text(index_sql))
            conn.commit()
            
            print("✅ PostgreSQL table 'plc_live_data' created successfully")
            
            # Test insertion with dummy data
            test_insert_sql = """
            INSERT INTO public.plc_live_data 
            (pellet1_ton_hr, pellet2_ton_hr, pellet3_ton_hr, 
             pellet1_kw_ton, pellet2_kw_ton, pellet3_kw_ton, 
             pellet1_temp, pellet2_temp, pellet3_temp)
            VALUES (7.0, 3.0, 0.0, 24.55, -1.34, 875.09, 185.5, 182.3, 188.7)
            """
            
            conn.execute(text(test_insert_sql))
            conn.commit()
            
            # Verify the insertion
            result = conn.execute(text("SELECT COUNT(*) FROM public.plc_live_data"))
            count = result.fetchone()[0]
            
            print(f"✅ Test data inserted successfully. Total records: {count}")
            
            # Show sample data
            sample_result = conn.execute(text("SELECT * FROM public.plc_live_data ORDER BY timestamp DESC LIMIT 1"))
            sample_row = sample_result.fetchone()
            
            if sample_row:
                print("📊 Sample data:")
                print(f"   ID: {sample_row[0]}")
                print(f"   Timestamp: {sample_row[1]}")
                print(f"   Pellet1_TonHr: {sample_row[2]}")
                print(f"   Pellet1_KwTon: {sample_row[5]}")
                print(f"   Pellet1_Temp: {sample_row[7]}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error creating PostgreSQL table: {e}")
        return False

def test_plc_connection():
    """Test PLC connection and data reading"""
    try:
        import snap7
        from snap7.util import get_real
        
        PLC_IP = "192.168.2.3"
        RACK = 0
        SLOT = 3
        DB4_SIZE = 36
        
        def read_real(data, offset):
            return get_real(data, offset)
        
        client = snap7.client.Client()
        client.connect(PLC_IP, RACK, SLOT)
        
        if client.get_connected():
            print("✅ PLC connection successful")
            
            # Read DB4 data
            data = client.db_read(4, 0, DB4_SIZE)
            
            plc_data = {
                "pellet1_ton_hr": read_real(data, 0),
                "pellet2_ton_hr": read_real(data, 4),
                "pellet3_ton_hr": read_real(data, 8),
                "pellet1_kw_ton": read_real(data, 12),
                "pellet2_kw_ton": read_real(data, 16),
                "pellet3_kw_ton": read_real(data, 20),
        "pellet1_temp": read_real(data, 24),  # Temperature values as read from PLC
        "pellet2_temp": read_real(data, 28),  # Temperature values as read from PLC
        "pellet3_temp": read_real(data, 32),  # Temperature values as read from PLC
            }
            
            print("📊 PLC Data read successfully:")
            for key, value in plc_data.items():
                print(f"   {key}: {value}")
            
            client.disconnect()
            return True
        else:
            print("❌ Failed to connect to PLC")
            return False
            
    except Exception as e:
        print(f"❌ Error testing PLC connection: {e}")
        print("⚠️  Make sure snap7 library is installed: pip install python-snap7")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up PLC Live Data System")
    print("=" * 50)
    
    # Test PostgreSQL connection and create table
    print("\n1. Setting up PostgreSQL table...")
    if create_postgresql_table():
        print("✅ PostgreSQL setup completed")
    else:
        print("❌ PostgreSQL setup failed")
        return
    
    # Test PLC connection
    print("\n2. Testing PLC connection...")
    if test_plc_connection():
        print("✅ PLC connection test completed")
    else:
        print("⚠️  PLC connection test failed - this is normal if PLC is not available")
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Start your Flask backend: python app.py")
    print("2. Start your React frontend")
    print("3. Navigate to /plc-reports in your frontend")
    print("4. Click 'Start Live' to begin data streaming")
    print("\n🔗 API Endpoints:")
    print("   - POST /api/plc-live/start - Start live streaming")
    print("   - POST /api/plc-live/stop - Stop live streaming")
    print("   - GET /api/plc-live/status - Get streaming status")
    print("   - GET /api/plc-live/latest - Get latest data")
    print("   - GET /api/plc-live/history - Get historical data")

if __name__ == "__main__":
    main()
