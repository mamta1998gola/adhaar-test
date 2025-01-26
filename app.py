from flask import Flask, request, jsonify, render_template
import zipfile
import os
import pandas as pd
import traceback
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder="templates", static_folder="static")

# Configure upload folder and allowed extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'zip', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB file size limit

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # Validate file presence
        if 'zip_file' not in request.files or 'excel_file' not in request.files:
            return jsonify({"error": "Both ZIP and Excel files are required"}), 400

        zip_file = request.files['zip_file']
        excel_file = request.files['excel_file']

        # Validate file names and extensions
        if zip_file.filename == '' or excel_file.filename == '':
            return jsonify({"error": "No selected files"}), 400

        if not allowed_file(zip_file.filename) or not allowed_file(excel_file.filename):
            return jsonify({"error": "Invalid file format. Only ZIP and XLSX allowed"}), 400

        # Secure and save files
        zip_filename = secure_filename(zip_file.filename)
        excel_filename = secure_filename(excel_file.filename)
        
        zip_path = os.path.join(app.config['UPLOAD_FOLDER'], zip_filename)
        excel_path = os.path.join(app.config['UPLOAD_FOLDER'], excel_filename)

        zip_file.save(zip_path)
        excel_file.save(excel_path)

        # Process ZIP file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                extract_path = os.path.join(app.config['UPLOAD_FOLDER'], 'extracted_zip')
                os.makedirs(extract_path, exist_ok=True)
                zip_ref.extractall(extract_path)
        except zipfile.BadZipFile:
            return jsonify({"error": "Invalid or corrupted ZIP file"}), 400
        except Exception as zip_error:
            return jsonify({
                "error": f"ZIP processing error: {str(zip_error)}",
                "details": traceback.format_exc()
            }), 500

        # Process Excel file
        try:
            excel_data = pd.read_excel(excel_path)
            data_preview = excel_data.head().to_dict()
        except Exception as excel_error:
            return jsonify({
                "error": f"Excel file processing error: {str(excel_error)}",
                "details": traceback.format_exc()
            }), 500

        # Optional: Cleanup uploaded files
        os.remove(zip_path)
        os.remove(excel_path)

        return jsonify({
            "message": "Files uploaded and processed successfully", 
            "excel_data_preview": data_preview
        }), 200

    except Exception as e:
        # Catch-all error handler
        print(f"Unexpected upload error: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            "error": "Unexpected server error during file upload",
            "details": str(e)
        }), 500

# Error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "File too large. Maximum 16MB allowed"}), 413

if __name__ == '__main__':
    app.run(debug=True)