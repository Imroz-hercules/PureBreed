# socket/db4_socket.py
from flask_socketio import emit, disconnect
from extensions import db
from models.plc_live_data import PLCLiveData
import snap7
from snap7.util import get_real
from datetime import datetime
import time
import threading
from flask import request

PLC_IP = "192.168.2.3"
RACK = 0
SLOT = 3
DB4_SIZE = 36

# Global variable to control the streaming
streaming_active = False
streaming_thread = None

def read_real(data, offset):
    return get_real(data, offset)

def fetch_db4_data():
    client = snap7.client.Client()
    try:
        client.connect(PLC_IP, RACK, SLOT)
        data = client.db_read(4, 0, DB4_SIZE)
        return {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
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
        return {"error": str(e), "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}
    finally:
        client.disconnect()

def start_db4_stream(socketio):
    global streaming_active, streaming_thread
    
    if streaming_thread and streaming_thread.is_alive():
        return  # Already running
    
    streaming_active = True
    
    def background_task():
        while streaming_active:
            try:
                data = fetch_db4_data()
                if "error" not in data:
                    # Store in database
                    record = DB4LiveData(**{k: v for k, v in data.items() if k != "timestamp"})
                    db.session.add(record)
                    db.session.commit()

                    # Emit to all connected clients
                    socketio.emit("db4_live_data", data)
                else:
                    # Emit error to all connected clients
                    socketio.emit("db4_error", data)
                
                time.sleep(10)  # adjust polling interval to 10 seconds
            except Exception as e:
                error_data = {
                    "error": f"Streaming error: {str(e)}",
                    "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                }
                socketio.emit("db4_error", error_data)
                time.sleep(10)  # Wait longer on error

    streaming_thread = threading.Thread(target=background_task)
    streaming_thread.daemon = True
    streaming_thread.start()

def stop_db4_stream():
    global streaming_active
    streaming_active = False

# Socket.IO event handlers
def register_socket_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print(f"Client connected: {request.sid}")
        emit('connected', {'message': 'Connected to DB4 WebSocket server'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print(f"Client disconnected: {request.sid}")

    @socketio.on('start_live_stream')
    def handle_start_stream():
        """Start live data streaming"""
        try:
            start_db4_stream(socketio)
            emit('stream_status', {'status': 'started', 'message': 'Live stream started'})
        except Exception as e:
            emit('stream_status', {'status': 'error', 'message': f'Failed to start stream: {str(e)}'})

    @socketio.on('stop_live_stream')
    def handle_stop_stream():
        """Stop live data streaming"""
        try:
            stop_db4_stream()
            emit('stream_status', {'status': 'stopped', 'message': 'Live stream stopped'})
        except Exception as e:
            emit('stream_status', {'status': 'error', 'message': f'Failed to stop stream: {str(e)}'})

    @socketio.on('get_single_reading')
    def handle_single_reading():
        """Get a single reading from PLC"""
        try:
            data = fetch_db4_data()
            if "error" not in data:
                emit('single_reading', data)
            else:
                emit('single_reading_error', data)
        except Exception as e:
            emit('single_reading_error', {'error': str(e), 'timestamp': datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")})

    @socketio.on('get_stream_status')
    def handle_get_status():
        """Get current streaming status"""
        global streaming_active, streaming_thread
        status = {
            'streaming': streaming_active,
            'thread_alive': streaming_thread.is_alive() if streaming_thread else False
        }
        emit('stream_status', status)
