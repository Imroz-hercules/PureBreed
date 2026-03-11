from flask import Blueprint, request, jsonify, send_from_directory
import os
import time
from werkzeug.utils import secure_filename
import math

logo_bp = Blueprint("logo", __name__)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@logo_bp.route("/logo", methods=["GET", "POST"])
def handle_logo():
    if request.method == "POST":
        if "logo" not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files["logo"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if file and allowed_file(file.filename):
            # Make the filename unique by appending a timestamp or counter
            filename = f"logo_{int(math.floor(time.time()))}.{file.filename.rsplit('.', 1)[1].lower()}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            return jsonify({"logoUrl": f"/api/uploads/{filename}"}), 200
        else:
            return jsonify({"error": "Invalid file type"}), 400

    # GET: Paginate logos in the upload folder
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 5, type=int)
    
    # Get all logos in the directory
    logos = [f for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)]
    
    # Calculate total pages
    total_pages = math.ceil(len(logos) / limit)
    
    # Paginate
    start = (page - 1) * limit
    end = start + limit
    paginated_logos = logos[start:end]
    
    # Create a response
    response = {
        "data": [{"logoUrl": f"/api/uploads/{logo}"} for logo in paginated_logos],
        "page": page,
        "total_pages": total_pages,
        "total_logos": len(logos)
    }
    
    return jsonify(response)

@logo_bp.route("/uploads/<filename>")
def serve_logo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
