from flask import Blueprint, jsonify, request
from models.plc_live_data import PLCLiveData
from extensions import db
import snap7
from snap7.util import get_real
from datetime import datetime, timezone
from sqlalchemy import desc
import threading
import time

plc_live_blueprint = Blueprint("plc_live", __name__)

PLC_IP = "192.168.2.3"
RACK = 0
SLOT = 3
DB4_SIZE = 36

# Global variables for live data streaming
streaming_active = False
streaming_thread = None

def read_real(data, offset):
    return get_real(data, offset)

def fetch_plc_data():
    """Fetch data from PLC DB4"""
    client = snap7.client.Client()
    try:
        client.connect(PLC_IP, RACK, SLOT)
        data = client.db_read(4, 0, DB4_SIZE)
        return {
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
    except Exception as e:
        return {"error": str(e)}
    finally:
        try:
            client.disconnect()
        except Exception:
            pass

def insert_plc_data_to_postgresql():
    """Insert PLC data into PostgreSQL database every 10 seconds"""
    try:
        # Import app for application context
        from app import app
        
        with app.app_context():
            # Use PostgreSQL bind
            from sqlalchemy import text
            postgres_session = db.get_engine(bind='postgresql').connect()
            
            data = fetch_plc_data()
            if "error" not in data:
                # Always insert data (no change detection)
                insert_query = text("""
                    INSERT INTO public.plc_live_data 
                    (timestamp, pellet1_ton_hr, pellet2_ton_hr, pellet3_ton_hr, 
                     pellet1_kw_ton, pellet2_kw_ton, pellet3_kw_ton, 
                     pellet1_temp, pellet2_temp, pellet3_temp)
                    VALUES (NOW(), :pellet1_ton_hr, :pellet2_ton_hr, :pellet3_ton_hr, 
                            :pellet1_kw_ton, :pellet2_kw_ton, :pellet3_kw_ton, 
                            :pellet1_temp, :pellet2_temp, :pellet3_temp)
                """)
                
                postgres_session.execute(insert_query, {
                    "pellet1_ton_hr": data["pellet1_ton_hr"],
                    "pellet2_ton_hr": data["pellet2_ton_hr"],
                    "pellet3_ton_hr": data["pellet3_ton_hr"],
                    "pellet1_kw_ton": data["pellet1_kw_ton"],
                    "pellet2_kw_ton": data["pellet2_kw_ton"],
                    "pellet3_kw_ton": data["pellet3_kw_ton"],
                    "pellet1_temp": data["pellet1_temp"],
                    "pellet2_temp": data["pellet2_temp"],
                    "pellet3_temp": data["pellet3_temp"]
                })
                postgres_session.commit()
                print(f"✅ Data inserted at {datetime.now().strftime('%H:%M:%S')} - pellet1_ton_hr: {data['pellet1_ton_hr']}")
                
            postgres_session.close()
        
    except Exception as e:
        print(f"Error inserting PLC data to PostgreSQL: {e}")

def live_data_stream():
    """Background thread for continuous data insertion"""
    global streaming_active
    print("🔄 Starting live data stream - inserting data every 10 seconds...")
    while streaming_active:
        try:
            insert_plc_data_to_postgresql()
            time.sleep(10)  # Insert every 10 seconds
        except Exception as e:
            print(f"Error in live data stream: {e}")
            time.sleep(10)  # Wait 10 seconds on error before retrying

def start_plc_streaming():
    """Start PLC streaming (for auto-start functionality)"""
    global streaming_active, streaming_thread
    
    if not streaming_active:
        streaming_active = True
        streaming_thread = threading.Thread(target=live_data_stream, daemon=True)
        streaming_thread.start()
        print("✅ DB4 (PLC Live Data) streaming started automatically")
        return True
    else:
        print("ℹ️ DB4 (PLC Live Data) streaming is already active")
        return True

# Start live data streaming
@plc_live_blueprint.route("/plc-live/start", methods=["POST"])
def start_live_stream():
    global streaming_active, streaming_thread
    
    if not streaming_active:
        streaming_active = True
        streaming_thread = threading.Thread(target=live_data_stream, daemon=True)
        streaming_thread.start()
        
        return jsonify({
            "message": "Live data streaming started",
            "status": "active",
            "insertion_interval": "10 seconds",
            "insertion_policy": "Store all data every 10 seconds"
        }), 200
    else:
        return jsonify({
            "message": "Live data streaming is already active",
            "status": "active"
        }), 200

# Stop live data streaming
@plc_live_blueprint.route("/plc-live/stop", methods=["POST"])
def stop_live_stream():
    global streaming_active
    
    if streaming_active:
        streaming_active = False
        return jsonify({
            "message": "Live data streaming stopped",
            "status": "inactive"
        }), 200
    else:
        return jsonify({
            "message": "Live data streaming is not active",
            "status": "inactive"
        }), 200

# Get streaming status
@plc_live_blueprint.route("/plc-live/status", methods=["GET"])
def get_stream_status():
    global streaming_active
    
    return jsonify({
        "streaming_active": streaming_active,
        "status": "active" if streaming_active else "inactive"
    }), 200

# Get latest live data from PostgreSQL
@plc_live_blueprint.route("/plc-live/latest", methods=["GET"])
def get_latest_data():
    try:
        # Use PostgreSQL bind
        postgres_engine = db.get_engine(bind='postgresql')
        
        with postgres_engine.connect() as conn:
            # Get the latest record
            from sqlalchemy import text
            result = conn.execute(text("""
                SELECT * FROM public.plc_live_data 
                ORDER BY timestamp DESC 
                LIMIT 1
            """))
            
            row = result.fetchone()
            if row:
                return jsonify({
                    "timestamp": row[1].strftime('%Y-%m-%d %H:%M:%S') if row[1] else None,
                    "pellet1_ton_hr": row[2],
                    "pellet2_ton_hr": row[3],
                    "pellet3_ton_hr": row[4],
                    "pellet1_kw_ton": row[5],
                    "pellet2_kw_ton": row[6],
                    "pellet3_kw_ton": row[7],
                    "pellet1_temp": row[8],
                    "pellet2_temp": row[9],
                    "pellet3_temp": row[10],
                }), 200
            else:
                return jsonify({"message": "No data available"}), 404
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get historical data from PostgreSQL
@plc_live_blueprint.route("/plc-live/history", methods=["GET"])
def get_historical_data():
    try:
        start_str = request.args.get("start")
        end_str = request.args.get("end")
        limit = request.args.get("limit", default=100, type=int)
        page = request.args.get("page", default=1, type=int)
        
        # Use PostgreSQL bind
        postgres_engine = db.get_engine(bind='postgresql')
        
        with postgres_engine.connect() as conn:
            # Build query
            from sqlalchemy import text
            query = "SELECT * FROM public.plc_live_data"
            params = {}
            
            if start_str and end_str:
                try:
                    query += " WHERE timestamp BETWEEN :start_date AND :end_date"
                    params["start_date"] = start_str
                    params["end_date"] = end_str
                except ValueError:
                    return jsonify({"error": "Invalid date format. Use ISO 8601."}), 400
            
            query += " ORDER BY timestamp DESC"
            query += f" LIMIT {limit} OFFSET {(page - 1) * limit}"
            
            result = conn.execute(text(query), params)
            
            results = []
            for row in result:
                results.append({
                    "timestamp": row[1].strftime('%Y-%m-%d %H:%M:%S') if row[1] else None,
                    "pellet1_ton_hr": row[2],
                    "pellet2_ton_hr": row[3],
                    "pellet3_ton_hr": row[4],
                    "pellet1_kw_ton": row[5],
                    "pellet2_kw_ton": row[6],
                    "pellet3_kw_ton": row[7],
                    "pellet1_temp": row[8],
                    "pellet2_temp": row[9],
                    "pellet3_temp": row[10],
                })
            
            return jsonify({
                "data": results,
                "page": page,
                "limit": limit,
                "total_records": len(results)
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Manual single data insertion (for testing)
@plc_live_blueprint.route("/plc-live/insert", methods=["POST"])
def manual_insert():
    try:
        insert_plc_data_to_postgresql()
        return jsonify({
            "message": "Data inserted successfully",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Simple database-only endpoint (no PLC required)
@plc_live_blueprint.route("/plc-data", methods=["GET"])
def get_plc_data_simple():
    """Simple endpoint to get PLC data from database only - no PLC connection required"""
    try:
        limit = request.args.get("limit", default=50, type=int)
        
        # Use PostgreSQL bind
        postgres_engine = db.get_engine(bind='postgresql')
        
        with postgres_engine.connect() as conn:
            from sqlalchemy import text
            query = text("""
                SELECT * FROM public.plc_live_data 
                ORDER BY timestamp DESC 
                LIMIT :limit
            """)
            
            result = conn.execute(query, {"limit": limit})
            
            results = []
            for row in result:
                results.append({
                    "timestamp": row[1].strftime('%Y-%m-%d %H:%M:%S') if row[1] else None,
                    "pellet1_ton_hr": row[2],
                    "pellet2_ton_hr": row[3],
                    "pellet3_ton_hr": row[4],
                    "pellet1_kw_ton": row[5],
                    "pellet2_kw_ton": row[6],
                    "pellet3_kw_ton": row[7],
                    "pellet1_temp": row[8],
                    "pellet2_temp": row[9],
                    "pellet3_temp": row[10],
                })
            
            return jsonify({
                "data": results,
                "total_records": len(results),
                "message": "Data fetched from PostgreSQL database"
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Completely simple database-only endpoint (no PLC, no streaming, just data)
@plc_live_blueprint.route("/simple-data", methods=["GET"])
def get_simple_data():
    """Ultra-simple endpoint - just get data from database, no PLC connection needed"""
    try:
        limit = request.args.get("limit", default=50, type=int)
        page = request.args.get("page", default=1, type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Use PostgreSQL bind
        postgres_engine = db.get_engine(bind='postgresql')
        
        with postgres_engine.connect() as conn:
            from sqlalchemy import text
            
            # First, get total count for pagination
            count_query = """
                SELECT COUNT(*) FROM public.plc_live_data 
            """
            count_params = {}
            
            if start_date and end_date:
                count_query += " WHERE DATE(timestamp) BETWEEN :start_date AND :end_date"
                count_params["start_date"] = start_date
                count_params["end_date"] = end_date
            elif start_date:
                count_query += " WHERE DATE(timestamp) >= :start_date"
                count_params["start_date"] = start_date
            elif end_date:
                count_query += " WHERE DATE(timestamp) <= :end_date"
                count_params["end_date"] = end_date
            
            count_result = conn.execute(text(count_query), count_params)
            total_records = count_result.fetchone()[0]
            
            # Build main query with date filtering and pagination
            query = """
                SELECT timestamp, pellet1_ton_hr, pellet2_ton_hr, pellet3_ton_hr, 
                       pellet1_kw_ton, pellet2_kw_ton, pellet3_kw_ton, 
                       pellet1_temp, pellet2_temp, pellet3_temp
                FROM public.plc_live_data 
            """
            
            params = {}
            
            # Add date filtering if provided
            if start_date and end_date:
                query += " WHERE DATE(timestamp) BETWEEN :start_date AND :end_date"
                params["start_date"] = start_date
                params["end_date"] = end_date
            elif start_date:
                query += " WHERE DATE(timestamp) >= :start_date"
                params["start_date"] = start_date
            elif end_date:
                query += " WHERE DATE(timestamp) <= :end_date"
                params["end_date"] = end_date
            
            query += " ORDER BY timestamp DESC LIMIT :limit OFFSET :offset"
            params["limit"] = limit
            params["offset"] = offset
            
            result = conn.execute(text(query), params)
            
            data = []
            for row in result:
                data.append({
                    "timestamp": row[0].strftime('%Y-%m-%d %H:%M:%S') if row[0] else None,
                    "pellet1_ton_hr": float(row[1]) if row[1] else 0.0,
                    "pellet2_ton_hr": float(row[2]) if row[2] else 0.0,
                    "pellet3_ton_hr": float(row[3]) if row[3] else 0.0,
                    "pellet1_kw_ton": float(row[4]) if row[4] else 0.0,
                    "pellet2_kw_ton": float(row[5]) if row[5] else 0.0,
                    "pellet3_kw_ton": float(row[6]) if row[6] else 0.0,
                    "pellet1_temp": float(row[7]) if row[7] else 0.0,
                    "pellet2_temp": float(row[8]) if row[8] else 0.0,
                    "pellet3_temp": float(row[9]) if row[9] else 0.0,
                })
            
            return jsonify({
                "success": True,
                "data": data,
                "count": len(data),
                "total_records": total_records,
                "current_page": page,
                "total_pages": (total_records + limit - 1) // limit,
                "start_date": start_date,
                "end_date": end_date,
                "message": f"Data fetched successfully from PostgreSQL (filtered by date range)"
            }), 200
            
    except Exception as e:
        print(f"Error in simple-data endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "data": []
        }), 500
