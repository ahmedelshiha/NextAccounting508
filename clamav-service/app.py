from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import tempfile, subprocess, os, time
import logging

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_EXT = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
    'txt', 'csv', 'xml', 'json'
}

def allowed_filename(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check ClamAV daemon
        result = subprocess.run(['clamd', '--version'], 
                              capture_output=True, text=True, timeout=5)
        # Check database freshness (best-effort)
        db_info = subprocess.run(['sigtool', '--info', '/var/lib/clamav/main.cvd'],
                               capture_output=True, text=True, timeout=5)
        return jsonify({
            "status": "healthy",
            "clamav_version": result.stdout.strip() if result.returncode == 0 else "unknown",
            "database_info": db_info.stdout.strip() if db_info.returncode == 0 else "unknown",
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/scan', methods=['POST'])
def scan_file():
    """Scan uploaded file for malware"""
    start_time = time.time()
    # API key validation
    api_key = os.environ.get('AV_API_KEY')
    if api_key and request.headers.get('X-API-KEY') != api_key:
        return jsonify({"error": "unauthorized"}), 401

    # File validation
    if 'file' not in request.files:
        return jsonify({"error": "no file provided"}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "no filename"}), 400

    filename = secure_filename(file.filename)
    if not allowed_filename(filename):
        return jsonify({"error": "disallowed file type"}), 400

    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}")
    try:
        # Save uploaded file
        file.save(temp_file.name)
        temp_file.close()
        # Get file stats
        file_size = os.path.getsize(temp_file.name)
        logger.info(f"Scanning file: {filename} ({file_size} bytes)")
        # Run ClamAV scan
        scan_result = subprocess.run([
            'clamdscan', 
            '--no-summary',
            '--infected',
            temp_file.name
        ], capture_output=True, text=True, timeout=120)
        scan_time = time.time() - start_time
        # Parse results
        if scan_result.returncode == 0:
            status = 'clean'
            threat = None
        elif scan_result.returncode == 1:
            status = 'infected'
            output_lines = scan_result.stdout.strip().split('\n')
            threat = output_lines[-1].split(': ')[-1] if output_lines else 'Unknown threat'
        else:
            status = 'error'
            threat = None
        response_data = {
            "status": status,
            "filename": filename,
            "file_size": file_size,
            "scan_time": round(scan_time, 3),
            "threat_name": threat,
            "scan_output": scan_result.stdout.strip(),
            "timestamp": time.time()
        }
        if status == 'error':
            response_data["error_details"] = scan_result.stderr.strip()
        logger.info(f"Scan completed: {filename} -> {status} ({scan_time:.3f}s)")
        return jsonify(response_data)
    except subprocess.TimeoutExpired:
        logger.error(f"Scan timeout for file: {filename}")
        return jsonify({
            "error": "scan timeout",
            "filename": filename,
            "scan_time": time.time() - start_time
        }), 500
    except Exception as e:
        logger.error(f"Scan failed for file {filename}: {e}")
        return jsonify({
            "error": "scan failed",
            "filename": filename,
            "details": str(e)
        }), 500
    finally:
        # Cleanup
        try:
            os.unlink(temp_file.name)
        except Exception as cleanup_error:
            logger.warning(f"Failed to cleanup temp file: {cleanup_error}")

@app.route('/update', methods=['POST'])
def update_signatures():
    """Trigger virus signature database update"""
    api_key = os.environ.get('AV_API_KEY')
    if api_key and request.headers.get('X-API-KEY') != api_key:
        return jsonify({"error": "unauthorized"}), 401
    try:
        result = subprocess.run(['freshclam'], capture_output=True, text=True, timeout=300)
        return jsonify({
            "status": "updated" if result.returncode == 0 else "failed",
            "output": result.stdout.strip(),
            "error": result.stderr.strip() if result.returncode != 0 else None
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "update timeout"}), 500
    except Exception as e:
        return jsonify({"error": "update failed", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
