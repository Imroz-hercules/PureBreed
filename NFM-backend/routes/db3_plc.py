from flask import Blueprint, jsonify, request, current_app
from models.db3_live_data import DB3LiveData
from extensions import db
# import snap7
# from snap7.util import get_real
from datetime import datetime, timezone
from sqlalchemy import desc
import threading
import time
import logging

db3_blueprint = Blueprint("db3", __name__)

# PLC_IP = "192.168.2.18"  # COMMENTED OUT - no snap7/IP storage
# RACK = 0
# SLOT = 3
# DB3_SIZE = 8  # 2 REAL values (4 bytes each)

# Global variables for service management
insertion_thread = None
insertion_running = False
last_insertion_time = None
insertion_errors = []

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# def read_real(data, offset):
#     return get_real(data, offset)

def fetch_db3_data():
    """Fetch data from PLC DB3 - Mill Amps (COMMENTED OUT: snap7/IP disabled, returning stub)"""
    # client = snap7.client.Client()
    # try:
    #     client.connect(PLC_IP, RACK, SLOT)
    #     data = client.db_read(3, 0, DB3_SIZE)
    #     return {
    #         "hammermill_amp": read_real(data, 0),
    #         "rollermill_amp": read_real(data, 4),
    #     }
    # except Exception as e:
    #     logger.error(f"Error reading from PLC: {e}")
    #     return {"error": str(e)}
    # finally:
    #     try:
    #         client.disconnect()
    #     except Exception:
    #         pass
    return {"hammermill_amp": 0.0, "rollermill_amp": 0.0}  # stub when snap7 disabled

# def insert_db3_data_to_postgresql():
#     """Insert DB3 data into PostgreSQL database - COMMENTED OUT (no PostgreSQL/snap7 storage)"""
#     global last_insertion_time, insertion_errors
#     ...
#     return False
#
# def run_insertion_service():
#     """Main insertion service loop - COMMENTED OUT"""
#     ...
#
# def start_db3_streaming():
#     """Start DB3 streaming - COMMENTED OUT"""
#     ...

def _insert_db3_data_to_postgresql_stub():
    """Stub: PostgreSQL/snap7 storage disabled."""
    return False

def _run_insertion_service_stub():
    """Stub: insertion service disabled."""
    pass

def start_db3_streaming():
    """Start DB3 streaming (COMMENTED OUT - no auto-start, no-op)"""
    return True  # no-op so app startup does not fail

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

# Store a row in database (COMMENTED OUT - no PostgreSQL/snap7 storage)
@db3_blueprint.route("/db3/live", methods=["POST"])
def insert_db3_live():
    # data = fetch_db3_data()
    # if "error" in data:
    #     return jsonify(data), 500
    # record = DB3LiveData(**data)
    # db.session.add(record)
    # db.session.commit()
    # return jsonify({"message": "DB3 data stored", "data": data}), 201
    return jsonify({"message": "DB3 storage disabled (PostgreSQL/snap7 commented out)"}), 503

# Start DB3 data insertion service (COMMENTED OUT)
@db3_blueprint.route("/db3/start-insertion", methods=["POST"])
def start_db3_insertion():
    # insertion_thread, run_insertion_service - disabled
    return jsonify({
        "success": False,
        "message": "DB3 insertion service disabled (PostgreSQL/snap7 commented out)"
    }), 503

# Stop DB3 data insertion service (COMMENTED OUT)
@db3_blueprint.route("/db3/stop-insertion", methods=["POST"])
def stop_db3_insertion():
    return jsonify({
        "success": False,
        "message": "DB3 insertion service disabled (PostgreSQL/snap7 commented out)"
    }), 503

# Get service status (returns disabled when PostgreSQL/snap7 commented out)
@db3_blueprint.route("/db3/status", methods=["GET"])
def get_insertion_status():
    global insertion_running, last_insertion_time, insertion_thread, insertion_errors
    status = {
        "service_running": False,
        "thread_alive": False,
        "last_insertion": last_insertion_time.isoformat() if last_insertion_time else None,
        "recent_errors": insertion_errors[-5:] if insertion_errors else [],
        "total_errors": len(insertion_errors),
        "uptime": None,
        "message": "DB3 insertion disabled (PostgreSQL/snap7 commented out)"
    }
    return jsonify(status), 200

# Manual insertion endpoint (COMMENTED OUT)
@db3_blueprint.route("/db3/insert-now", methods=["POST"])
def insert_now():
    return jsonify({"success": False, "message": "DB3 storage disabled (PostgreSQL/snap7 commented out)"}), 503

# Test database connection (COMMENTED OUT - no PostgreSQL)
@db3_blueprint.route("/db3/test-connection", methods=["GET"])
def test_db_connection():
    return jsonify({
        "success": False,
        "error": "PostgreSQL disabled (commented out)",
        "timestamp": datetime.now().isoformat()
    }), 503

# Restart insertion service (COMMENTED OUT)
@db3_blueprint.route("/db3/restart", methods=["POST"])
def restart_insertion_service():
    return jsonify({"success": False, "message": "DB3 insertion service disabled (PostgreSQL/snap7 commented out)"}), 503

# Query historical data from database (COMMENTED OUT - no PostgreSQL)
@db3_blueprint.route("/db3/query", methods=["GET"])
def query_db3_data():
    return jsonify({"data": [], "page": 1, "pages": 0, "total": 0, "message": "PostgreSQL disabled"}), 200

# Completely simple database-only endpoint (COMMENTED OUT - no PostgreSQL)
@db3_blueprint.route("/db3/simple-data", methods=["GET"])
def get_db3_simple_data():
    return jsonify({
        "success": True,
        "data": [],
        "count": 0,
        "total_records": 0,
        "current_page": 1,
        "total_pages": 0,
        "message": "PostgreSQL disabled (commented out)"
    }), 200
