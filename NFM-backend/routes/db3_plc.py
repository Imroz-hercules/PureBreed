from flask import Blueprint, jsonify, request, current_app
from models.db3_live_data import DB3LiveData
from extensions import db
import snap7
from snap7.util import get_real
from datetime import datetime, timezone
from sqlalchemy import desc
import threading
import time
import logging

db3_blueprint = Blueprint("db3", __name__)

PLC_IP = "192.168.2.18"  # Using the IP from your read_db3.py
RACK = 0
SLOT = 3
DB3_SIZE = 8  # 2 REAL values (4 bytes each)

# Global variables for service management
insertion_thread = None
insertion_running = False
last_insertion_time = None
insertion_errors = []

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def read_real(data, offset):
    return get_real(data, offset)

def fetch_db3_data():
    """Fetch data from PLC DB3 - Mill Amps"""
    client = snap7.client.Client()
    try:
        client.connect(PLC_IP, RACK, SLOT)
        data = client.db_read(3, 0, DB3_SIZE)
        return {
            "hammermill_amp": read_real(data, 0),
            "rollermill_amp": read_real(data, 4),
        }
    except Exception as e:
        logger.error(f"Error reading from PLC: {e}")
        return {"error": str(e)}
    finally:
        try:
            client.disconnect()
        except Exception:
            pass

def insert_db3_data_to_postgresql():
    """Insert DB3 data into PostgreSQL database"""
    global last_insertion_time, insertion_errors
    
    try:
        data = fetch_db3_data()
        if "error" in data:
            error_msg = f"Failed to read from PLC: {data['error']}"
            logger.error(error_msg)
            insertion_errors.append({
                "timestamp": datetime.now().isoformat(),
                "error": error_msg
            })
            # Keep only last 10 errors
            if len(insertion_errors) > 10:
                insertion_errors = insertion_errors[-10:]
            return False
        
        # Create new record with proper session handling
        try:
            # Use direct database connection to avoid Flask context issues
            from sqlalchemy import create_engine, text
            from config import Config
            
            # Create a new engine for this thread using PostgreSQL bind
            engine = create_engine(Config.SQLALCHEMY_BINDS['postgresql'])
            
            with engine.connect() as conn:
                # Insert data directly using SQL with proper text() wrapper
                insert_query = text("""
                    INSERT INTO db3_live_data (hammermill_amp, rollermill_amp, timestamp)
                    VALUES (:hammermill_amp, :rollermill_amp, :timestamp)
                """)
                
                conn.execute(
                    insert_query,
                    {
                        "hammermill_amp": data["hammermill_amp"],
                        "rollermill_amp": data["rollermill_amp"],
                        "timestamp": datetime.now()
                    }
                )
                conn.commit()
                
                last_insertion_time = datetime.now()
                logger.info(f"DB3 data inserted successfully: {data}")
                return True
                
        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            raise db_error
        
    except Exception as e:
        error_msg = f"Database insertion error: {e}"
        logger.error(error_msg)
        insertion_errors.append({
            "timestamp": datetime.now().isoformat(),
            "error": error_msg
        })
        # Keep only last 10 errors
        if len(insertion_errors) > 10:
            insertion_errors = insertion_errors[-10:]
        return False

def run_insertion_service():
    """Main insertion service loop"""
    global insertion_running, last_insertion_time
    
    logger.info("DB3 insertion service started")
    last_insertion_time = datetime.now()
    
    while insertion_running:
        try:
            # Use Flask application context in the background thread
            # We'll get the app context when needed
            success = insert_db3_data_to_postgresql()
            if success:
                logger.debug("DB3 data inserted successfully")
            else:
                logger.warning("DB3 data insertion failed")
            
            # Wait 10 seconds before next insertion
            time.sleep(10)
            
        except Exception as e:
            logger.error(f"Critical error in insertion service: {e}")
            insertion_errors.append({
                "timestamp": datetime.now().isoformat(),
                "error": f"Critical error: {e}"
            })
            # Keep only last 10 errors
            if len(insertion_errors) > 10:
                insertion_errors = insertion_errors[-10:]
            
            # Wait a bit longer on critical errors
            time.sleep(10)
    
    logger.info("DB3 insertion service stopped")

def start_db3_streaming():
    """Start DB3 streaming (for auto-start functionality)"""
    global insertion_running, insertion_thread
    
    if not insertion_running:
        insertion_running = True
        insertion_thread = threading.Thread(target=run_insertion_service, daemon=True)
        insertion_thread.start()
        print("✅ DB3 (Mill Amps Data) streaming started automatically")
        return True
    else:
        print("ℹ️ DB3 (Mill Amps Data) streaming is already active")
        return True

# NEW: read directly from PLC, no DB write
@db3_blueprint.route("/db3/live/read", methods=["GET"])
def read_db3_live():
    data = fetch_db3_data()

    if "error" in data:
        return jsonify({
            "message": "Failed to read from PLC",
            "error": data["error"]
        }), 502  # Bad gateway - upstream device error

    # include a timestamp so clients know when the read happened
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        **data
    }

    return jsonify(payload), 200

# Store a row in database
@db3_blueprint.route("/db3/live", methods=["POST"])
def insert_db3_live():
    data = fetch_db3_data()
    if "error" in data:
        return jsonify(data), 500
    record = DB3LiveData(**data)
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "DB3 data stored", "data": data}), 201

# Start DB3 data insertion service
@db3_blueprint.route("/db3/start-insertion", methods=["POST"])
def start_db3_insertion():
    """Start automatic DB3 data insertion every 10 seconds"""
    global insertion_thread, insertion_running
    
    try:
        if insertion_running:
            return jsonify({
                "success": False,
                "message": "DB3 insertion service is already running"
            }), 400
        
        # Set flag to start service
        insertion_running = True
        
        # Start background thread for data insertion
        insertion_thread = threading.Thread(target=run_insertion_service, daemon=True)
        insertion_thread.start()
        
        logger.info("DB3 insertion service started successfully")
        
        return jsonify({
            "success": True,
            "message": "DB3 data insertion service started (every 10 seconds)",
            "status": "running"
        }), 200
        
    except Exception as e:
        insertion_running = False
        logger.error(f"Failed to start DB3 insertion service: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Stop DB3 data insertion service
@db3_blueprint.route("/db3/stop-insertion", methods=["POST"])
def stop_db3_insertion():
    """Stop automatic DB3 data insertion service"""
    global insertion_running, insertion_thread
    
    try:
        if not insertion_running:
            return jsonify({
                "success": False,
                "message": "DB3 insertion service is not running"
            }), 400
        
        # Set flag to stop service
        insertion_running = False
        
        # Wait for thread to finish (with timeout)
        if insertion_thread and insertion_thread.is_alive():
            insertion_thread.join(timeout=10)
        
        logger.info("DB3 insertion service stopped successfully")
        
        return jsonify({
            "success": True,
            "message": "DB3 data insertion service stopped",
            "status": "stopped"
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to stop DB3 insertion service: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Get service status
@db3_blueprint.route("/db3/status", methods=["GET"])
def get_insertion_status():
    """Get the current status of the DB3 insertion service"""
    global insertion_running, last_insertion_time, insertion_thread, insertion_errors
    
    status = {
        "service_running": insertion_running,
        "thread_alive": insertion_thread.is_alive() if insertion_thread else False,
        "last_insertion": last_insertion_time.isoformat() if last_insertion_time else None,
        "recent_errors": insertion_errors[-5:] if insertion_errors else [],  # Last 5 errors
        "total_errors": len(insertion_errors),
        "uptime": None
    }
    
    # Calculate uptime if service is running
    if insertion_running and last_insertion_time:
        uptime = datetime.now() - last_insertion_time
        status["uptime"] = str(uptime)
    
    return jsonify(status), 200

# Manual insertion endpoint
@db3_blueprint.route("/db3/insert-now", methods=["POST"])
def insert_now():
    """Manually insert DB3 data now"""
    try:
        success = insert_db3_data_to_postgresql()
        if success:
            return jsonify({
                "success": True,
                "message": "DB3 data inserted manually",
                "timestamp": datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to insert DB3 data manually"
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Test database connection
@db3_blueprint.route("/db3/test-connection", methods=["GET"])
def test_db_connection():
    """Test the database connection for DB3 insertion service"""
    try:
        from sqlalchemy import create_engine, text
        from config import Config
        
        # Test PostgreSQL connection
        engine = create_engine(Config.SQLALCHEMY_BINDS['postgresql'])
        
        with engine.connect() as conn:
            # Test a simple query with text() wrapper
            result = conn.execute(text("SELECT COUNT(*) FROM db3_live_data"))
            count = result.fetchone()[0]
            
            return jsonify({
                "success": True,
                "message": "Database connection successful",
                "db3_records_count": count,
                "timestamp": datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Database connection failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

# Restart insertion service
@db3_blueprint.route("/db3/restart", methods=["POST"])
def restart_insertion_service():
    """Restart the DB3 insertion service"""
    try:
        # Stop if running
        if insertion_running:
            insertion_running = False
            if insertion_thread and insertion_thread.is_alive():
                insertion_thread.join(timeout=5)
        
        # Wait a moment
        time.sleep(1)
        
        # Start again
        insertion_running = True
        insertion_thread = threading.Thread(target=run_insertion_service, daemon=True)
        insertion_thread.start()
        
        logger.info("DB3 insertion service restarted successfully")
        
        return jsonify({
            "success": True,
            "message": "DB3 insertion service restarted",
            "status": "running"
        }), 200
        
    except Exception as e:
        insertion_running = False
        logger.error(f"Failed to restart DB3 insertion service: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Query historical data from database
@db3_blueprint.route("/db3/query", methods=["GET"])
def query_db3_data():
    try:
        start_str = request.args.get("start")
        end_str = request.args.get("end")
        limit = request.args.get("limit", default=100, type=int)
        page = request.args.get("page", default=1, type=int)

        query = DB3LiveData.query

        if start_str and end_str:
            try:
                start_time = datetime.fromisoformat(start_str)
                end_time = datetime.fromisoformat(end_str)
                query = query.filter(DB3LiveData.timestamp.between(start_time, end_time))
            except ValueError:
                return jsonify({"error": "Invalid date format. Use ISO 8601."}), 400

        query = query.order_by(desc(DB3LiveData.timestamp))
        paginated = query.paginate(page=page, per_page=limit, error_out=False)

        results = []
        for row in paginated.items:
            results.append({
                "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "hammermill_amp": row.hammermill_amp,
                "rollermill_amp": row.rollermill_amp,
            })

        return jsonify({
            "data": results,
            "page": paginated.page,
            "pages": paginated.pages,
            "total": paginated.total
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Completely simple database-only endpoint (no PLC, no streaming, just data)
@db3_blueprint.route("/db3/simple-data", methods=["GET"])
def get_db3_simple_data():
    """Ultra-simple endpoint - just get DB3 data from database, no PLC connection needed"""
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
                SELECT COUNT(*) FROM public.db3_live_data 
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
                SELECT timestamp, hammermill_amp, rollermill_amp
                FROM public.db3_live_data 
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
                    "hammermill_amp": float(row[1]) if row[1] else 0.0,
                    "rollermill_amp": float(row[2]) if row[2] else 0.0,
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
                "message": f"DB3 data fetched successfully from PostgreSQL (filtered by date range)"
            }), 200
            
    except Exception as e:
        print(f"Error in DB3 simple-data endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "data": []
        }), 500
