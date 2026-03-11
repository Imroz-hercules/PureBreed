from flask import Blueprint, jsonify, request
from models.plc_live_data import PLCLiveData
from extensions import db
import snap7
from snap7.util import get_real
from datetime import datetime, timezone
from sqlalchemy import desc

db4_blueprint = Blueprint("db4", __name__)

PLC_IP = "192.168.2.3"
RACK = 0
SLOT = 3
DB4_SIZE = 36

def read_real(data, offset):
    return get_real(data, offset)

def fetch_db4_data():
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

# NEW: read directly from PLC, no DB write
@db4_blueprint.route("/db4/live/read", methods=["GET"])
def read_db4_live():
    data = fetch_db4_data()

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

    # optional rounding (uncomment if you want fewer decimals)
    # for k, v in payload.items():
    #     if isinstance(v, float):
    #         payload[k] = round(v, 3)

    return jsonify(payload), 200

# Existing endpoint that stores a row (unchanged)
@db4_blueprint.route("/db4/live", methods=["POST"])
def insert_db4_live():
    data = fetch_db4_data()
    if "error" in data:
        return jsonify(data), 500
    record = DB4LiveData(**data)
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "DB4 data stored", "data": data}), 201

# Existing query endpoint (unchanged)
@db4_blueprint.route("/db4/query", methods=["GET"])
def query_db4_data():
    try:
        start_str = request.args.get("start")
        end_str = request.args.get("end")
        limit = request.args.get("limit", default=100, type=int)
        page = request.args.get("page", default=1, type=int)

        query = DB4LiveData.query

        if start_str and end_str:
            try:
                start_time = datetime.fromisoformat(start_str)
                end_time = datetime.fromisoformat(end_str)
                query = query.filter(DB4LiveData.timestamp.between(start_time, end_time))
            except ValueError:
                return jsonify({"error": "Invalid date format. Use ISO 8601."}), 400

        query = query.order_by(desc(DB4LiveData.timestamp))
        paginated = query.paginate(page=page, per_page=limit, error_out=False)

        results = []
        for row in paginated.items:
            results.append({
                "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "pellet1_ton_hr": row.pellet1_ton_hr,
                "pellet2_ton_hr": row.pellet2_ton_hr,
                "pellet3_ton_hr": row.pellet3_ton_hr,
                "pellet1_kw_ton": row.pellet1_kw_ton,
                "pellet2_kw_ton": row.pellet2_kw_ton,
                "pellet3_kw_ton": row.pellet3_kw_ton,
                "pellet1_temp": row.pellet1_temp,
                "pellet2_temp": row.pellet2_temp,
                "pellet3_temp": row.pellet3_temp,
            })

        return jsonify({
            "data": results,
            "page": paginated.page,
            "pages": paginated.pages,
            "total": paginated.total
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
