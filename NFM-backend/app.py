# 
import sys
import os
import logging
import socket
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from config import Config
from extensions import db, migrate

# Add app root path for relative imports
sys.path.append(os.path.dirname(__file__))

# ------------------------------------------------------
# 🔒 Process Lock - Prevent Multiple Instances
# ------------------------------------------------------
def check_port_availability(port):
    """Check if port is available to prevent multiple instances"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def create_lock_file():
    """Create a lock file to prevent multiple instances"""
    lock_file = "flask_app.lock"
    try:
        if os.path.exists(lock_file):
            # Check if the process in lock file is still running
            with open(lock_file, 'r') as f:
                stored_pid = f.read().strip()
            
            try:
                # Check if the stored PID is the same as current process or its parent
                current_pid = os.getpid()
                parent_pid = os.getppid()
                
                if stored_pid == str(current_pid) or stored_pid == str(parent_pid):
                    # This is the same Flask instance (possibly debug mode restart)
                    return True
                
                # Check if the stored PID process exists
                os.kill(int(stored_pid), 0)  # Check if process exists
                print(f"❌ ERROR: Flask app is already running with PID {stored_pid}")
                print("💡 Please stop the existing instance before starting a new one.")
                sys.exit(1)
            except OSError:
                # Process not running, remove stale lock file
                os.remove(lock_file)
        
        # Create new lock file
        with open(lock_file, 'w') as f:
            f.write(str(os.getpid()))
        return True
    except Exception as e:
        print(f"❌ ERROR creating lock file: {e}")
        return False

# Check if another instance is already running
if not check_port_availability(5002):
    print("❌ ERROR: Another Flask instance is already running on port 5002!")
    print("💡 Please stop the existing instance before starting a new one.")
    sys.exit(1)

if not create_lock_file():
    print("❌ ERROR: Cannot create lock file - another instance might be running")
    sys.exit(1)

print("✅ Port 5002 is available - starting Flask app...")
print(f"✅ Process lock created for PID {os.getpid()}")

# ------------------------------------------------------
# 🔧 Initialize Flask App and Configuration
# ------------------------------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# ------------------------------------------------------
# 🔌 Initialize SocketIO
# ------------------------------------------------------
socketio = SocketIO(app, cors_allowed_origins="*")

# ------------------------------------------------------
# 📝 Configure Logging
# ------------------------------------------------------
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3, encoding='utf-8')
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)

# ------------------------------------------------------
# 🔓 Enable CORS
# ------------------------------------------------------
CORS(app, supports_credentials=True, origins=[
    # Any local Vite/dev port (5173, 5174, 5180, …)
    r"http://localhost:\d+",
    r"http://127\.0\.0\.1:\d+",
    "http://localhost:5174", "http://localhost:5173", "http://localhost:5180", "http://localhost:3000",
    "http://127.0.0.1:5180", "http://127.0.0.1:5174",
    "http://host.docker.internal:5000",
    "http://192.168.1.212:5174", "http://192.168.1.253:5174", "http://192.168.1.252:5174",
    "http://192.168.1.213:5174", "http://192.168.0.251:5174",
    "http://172.29.16.1:5174", "http://172.20.16.1:5174", "http://172.18.128.1:5174",
    "http://192.168.8.13:5174", "http://192.168.2.40:5174",
    # PureBread Vite port 5180 (LAN)
    "http://192.168.8.117:5180", "http://192.168.2.40:5180", "http://192.168.20.13:5180",
    "http://192.168.8.13:5180",
])

# ------------------------------------------------------
# 🗃️ Database Setup with Error Handling
# ------------------------------------------------------
try:
    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        db.engine.connect()
    app.logger.info("✅ Database connection established successfully")
except Exception as e:
    app.logger.warning(f"⚠️ Database connection failed: {str(e)}")
    app.logger.warning("⚠️ Server will start without database functionality")
    # Don't raise the exception, continue without database

# ------------------------------------------------------
# 🔌 Register Blueprints and Start Background Tasks
# ------------------------------------------------------
try:
    # Import blueprints with error handling
    blueprints_loaded = []
    
    try:
        from routes.db4_plc import db4_blueprint
        app.register_blueprint(db4_blueprint, url_prefix="/api")
        blueprints_loaded.append("db4_plc")
        app.logger.info("✅ DB4 PLC blueprint registered")
    except ImportError as e:
        app.logger.warning(f"⚠️ Failed to import db4_plc: {str(e)}")
    
    try:
        from routes.db3_plc import db3_blueprint
        app.register_blueprint(db3_blueprint, url_prefix="/api")
        blueprints_loaded.append("db3_plc")
        app.logger.info("✅ DB3 PLC blueprint registered")
    except ImportError as e:
        app.logger.warning(f"⚠️ Failed to import db3_plc: {str(e)}")
    
    try:
        from routes.plc_live_data import plc_live_blueprint
        app.register_blueprint(plc_live_blueprint, url_prefix="/api")
        blueprints_loaded.append("plc_live_data")
        app.logger.info("✅ PLC Live Data blueprint registered")
    except ImportError as e:
        app.logger.warning(f"⚠️ Failed to import plc_live_data: {str(e)}")
    
    try:
        from websocket_module.db4_socket import register_socket_events
        register_socket_events(socketio)  # Register WebSocket event handlers
        app.logger.info("✅ WebSocket events registered")
    except ImportError as e:
        app.logger.warning(f"⚠️ Failed to import websocket: {str(e)}")
    
    # Try to import other blueprints (optional)
    try:
        from routes.kpi_routes import kpi_blueprint as kpi_bp
        app.register_blueprint(kpi_bp, url_prefix="/api")
        blueprints_loaded.append("kpi_routes")
    except ImportError:
        pass
    
    try:
        from routes.logo_routes import logo_bp
        app.register_blueprint(logo_bp, url_prefix="/api")
        blueprints_loaded.append("logo_routes")
    except ImportError:
        pass
    
    try:
        from routes.settings import settings_bp
        app.register_blueprint(settings_bp, url_prefix="/api")
        blueprints_loaded.append("settings")
    except ImportError:
        pass
    
    try:
        from routes.report_scheduler import report_bp, start_scheduler
        app.register_blueprint(report_bp, url_prefix="/api")
        start_scheduler()
        blueprints_loaded.append("report_scheduler")
    except Exception as e:
        app.logger.warning(f"⚠️ Failed to import report_scheduler: {str(e)}")
    
    try:
        from routes.kpi_calendar_api import kpi_calendar_bp
        app.register_blueprint(kpi_calendar_bp, url_prefix="/api")
        blueprints_loaded.append("kpi_calendar_api")
    except ImportError:
        pass

    try:
        from routes.ssrs_reports import ssrs_bp
        app.register_blueprint(ssrs_bp, url_prefix="/api")
        blueprints_loaded.append("ssrs_reports")
    except ImportError as e:
        app.logger.warning(f"⚠️ Failed to import ssrs_reports: {str(e)}")

    app.logger.info(f"✅ Loaded blueprints: {', '.join(blueprints_loaded)}")
    
    # # ------------------------------------------------------
    # # 🚀 Auto-Start Data Storage Services (COMMENTED OUT - no PostgreSQL/snap7 storage)
    # # ------------------------------------------------------
    # try:
    #     if "plc_live_data" in blueprints_loaded:
    #         from routes.plc_live_data import start_plc_streaming
    #         ...
    #     if "db3_plc" in blueprints_loaded:
    #         from routes.db3_plc import start_db3_streaming
    #         ...
    #     app.logger.info("🎉 All data storage services auto-started on backend startup!")
    # except Exception as e:
    #     ...
    pass  # Auto-start of DB3/DB4 streaming disabled
    
except Exception as e:
    app.logger.error(f"❌ Error during blueprint registration: {str(e)}")
    # Don't raise, continue with what we have

# ------------------------------------------------------
# 🏠 Root Route
# ------------------------------------------------------
@app.route("/")
def index():
    return jsonify({
        "message": "Backend API is running!",
        "endpoints": {
            "kpi": "/api/kpi",
            "logo": "/api/logo",
            "settings": "/api/settings",
            "reports": "/api/reports",
            "db3": "/api/db3/query | /api/db3/live",
            "db4": "/api/db4/query | /api/db4/live",
            "socket": "/ws (via Socket.IO)"
        }
    }), 200

# ------------------------------------------------------
# 🛑 Error Handlers
# ------------------------------------------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

# ------------------------------------------------------
# 🚀 Run the Flask App (with WebSocket Support)
# ------------------------------------------------------
if __name__ == "__main__":
    import atexit
    import signal
    
    def cleanup_lock_file():
        """Clean up lock file when app exits"""
        try:
            if os.path.exists("flask_app.lock"):
                os.remove("flask_app.lock")
                print("✅ Lock file cleaned up")
        except Exception as e:
            print(f"⚠️ Warning: Could not clean up lock file: {e}")
    
    def cleanup_scheduler():
        """Clean up scheduler when app exits"""
        try:
            from routes.report_scheduler import stop_scheduler
            stop_scheduler()
        except Exception as e:
            print(f"⚠️ Warning: Could not clean up scheduler: {e}")
    
    def signal_handler(signum, frame):
        """Handle shutdown signals gracefully"""
        print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
        cleanup_scheduler()
        cleanup_lock_file()
        sys.exit(0)
    
    # Register cleanup functions
    atexit.register(cleanup_scheduler)
    atexit.register(cleanup_lock_file)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    app.logger.info("🚀 Starting application...")
    try:
        socketio.run(app, debug=True, host="0.0.0.0", port=5002)
    except Exception as e:
        app.logger.error(f"❌ Failed to start application: {str(e)}")
        cleanup_scheduler()
        cleanup_lock_file()
        raise
