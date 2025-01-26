from flask import Flask, request, jsonify, render_template
import zipfile
import os
import pandas as pd
# import traceback
import tempfile
import sqlite3
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder="templates", static_folder="static")

# Use temporary directory for file operations
TEMP_DIR = tempfile.gettempdir()

def init_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            matchScore INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/add_user', methods=['POST'])
def add_user():
    try:
        data = request.json
        uid = data.get('uid')
        name = data.get('name')
        matchScore = data.get('matchScore')

        print("----", data, uid, name, matchScore)
        # Validate required fields
        if not uid or not name or not matchScore:
            return jsonify({"error": "UID, name, and matchScore are required"}), 400

        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()

        try:
            cursor.execute('INSERT INTO users (uid, name, matchScore) VALUES (?, ?, ?)', 
                           (uid, name, matchScore))
            conn.commit()
            return jsonify({"message": "User added successfully"}), 201
        except sqlite3.IntegrityError:
            return jsonify({"error": "User with this UID already exists"}), 409
        finally:
            conn.close()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()

        # Optional filtering by UID
        uid = request.args.get('uid')
        
        if uid:
            cursor.execute('SELECT * FROM users WHERE uid = ?', (uid,))
        else:
            cursor.execute('SELECT * FROM users')
        
        users = cursor.fetchall()
        conn.close()

        # Convert to list of dictionaries
        user_list = [
            {"uid": user[0], "name": user[1], "matchScore": user[2]} 
            for user in users
        ]

        return jsonify(user_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

        # Use temporary file paths
        zip_path = os.path.join(TEMP_DIR, secure_filename(zip_file.filename))
        excel_path = os.path.join(TEMP_DIR, secure_filename(excel_file.filename))

        # Save files to temporary directory
        zip_file.save(zip_path)
        excel_file.save(excel_path)

        # Process ZIP file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                extract_path = os.path.join(TEMP_DIR, 'extracted_zip')
                os.makedirs(extract_path, exist_ok=True)
                zip_ref.extractall(extract_path)
        except Exception as zip_error:
            return jsonify({"error": f"ZIP processing error: {str(zip_error)}"}), 500

        # Process Excel file
        try:
            excel_data = pd.read_excel(excel_path)
            data_preview = excel_data.head().to_dict()
        except Exception as excel_error:
            return jsonify({"error": f"Excel file processing error: {str(excel_error)}"}), 500

        # Cleanup temporary files
        os.remove(zip_path)
        os.remove(excel_path)

        return jsonify({
            "message": "Files uploaded and processed successfully", 
            "excel_data_preview": data_preview
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Unexpected server error during file upload",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)