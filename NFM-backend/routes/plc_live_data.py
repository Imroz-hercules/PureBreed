from flask import Blueprint, jsonify, request
from models.plc_live_data import PLCLiveData
from extensions import db
# import snap7
# from snap7.util import get_real
from datetime import datetime, timezone
from sqlalchemy import desc
import threading
import time

plc_live_blueprint = Blueprint("plc_live", __name__)

# PLC_IP = "192.168.2.3"   # COMMENTED OUT - no snap7/IP storage
# RACK = 0
# SLOT = 3
# DB4_SIZE = 36

# Global variables for live data streaming
streaming_active = False
streaming_thread = None

# def read_real(data, offset):
#     return get_real(data, offset)

def fetch_plc_data():
    """Fetch data from PLC DB4 (COMMENTED OUT - snap7 disabled, returning stub)"""
    # client = snap7.client.Client()
    # try:
    #     client.connect(PLC_IP, RACK, SLOT)
    #     data = client.db_read(4, 0, DB4_SIZE)
    #     return { ... }
    # except ...
    return {
        "pellet1_ton_hr": 0.0, "pellet2_ton_hr": 0.0, "pellet3_ton_hr": 0.0,
        "pellet1_kw_ton": 0.0, "pellet2_kw_ton": 0.0, "pellet3_kw_ton": 0.0,
        "pellet1_temp": 0.0, "pellet2_temp": 0.0, "pellet3_temp": 0.0,
    }

# def insert_plc_data_to_postgresql(): ... COMMENTED OUT (no PostgreSQL/snap7)

def _insert_plc_data_to_postgresql_stub():
    pass  # no-op

def live_data_stream():
    """Background thread - COMMENTED OUT (no insertion), just sleep to avoid busy loop"""
    global streaming_active
    while streaming_active:
        time.sleep(10)

def start_plc_streaming():
    """Start PLC streaming (COMMENTED OUT - no-op so app startup does not fail)"""
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

# Get latest live data from PostgreSQL (COMMENTED OUT - no PostgreSQL)
@plc_live_blueprint.route("/plc-live/latest", methods=["GET"])
def get_latest_data():
    return jsonify({"message": "No data available (PostgreSQL/snap7 commented out)"}), 404

# Get historical data from PostgreSQL (COMMENTED OUT)
@plc_live_blueprint.route("/plc-live/history", methods=["GET"])
def get_historical_data():
    return jsonify({"data": [], "page": 1, "limit": 100, "total_records": 0}), 200

# Manual single data insertion (COMMENTED OUT)
@plc_live_blueprint.route("/plc-live/insert", methods=["POST"])
def manual_insert():
    return jsonify({"message": "Storage disabled (PostgreSQL/snap7 commented out)"}), 503

# Simple database-only endpoint (COMMENTED OUT - no PostgreSQL)
@plc_live_blueprint.route("/plc-data", methods=["GET"])
def get_plc_data_simple():
    return jsonify({"data": [], "total_records": 0, "message": "PostgreSQL disabled"}), 200

# Completely simple database-only endpoint (COMMENTED OUT - no PostgreSQL)
@plc_live_blueprint.route("/simple-data", methods=["GET"])
def get_simple_data():
    return jsonify({
        "success": True,
        "data": [],
        "count": 0,
        "total_records": 0,
        "current_page": 1,
        "total_pages": 0,
        "message": "PostgreSQL disabled (commented out)"
    }), 200
