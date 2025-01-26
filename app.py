from flask import Flask, request, jsonify, render_template
import zipfile
import os
import pandas as pd
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure upload folder and allowed extensions
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'zip', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    # Check if files are present
    if 'zip_file' not in request.files or 'excel_file' not in request.files:
        return jsonify({"error": "Both files are required!"}), 400

    zip_file = request.files['zip_file']
    excel_file = request.files['excel_file']

    # Secure filenames and save files
    zip_path = os.path.join(app.config['UPLOAD_FOLDER'], zip_file.filename)
    excel_path = os.path.join(app.config['UPLOAD_FOLDER'], excel_file.filename)

    zip_file.save(zip_path)
    excel_file.save(excel_path)

    # Process ZIP file
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(os.path.join(app.config['UPLOAD_FOLDER'], 'extracted_zip'))

    # Process Excel file
    excel_data = pd.read_excel(excel_path)

    return jsonify({"message": "Files uploaded successfully", "excel_data_preview": excel_data.head().to_dict()}), 200


def handle_zip(zip_path):
    contents = []
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(UPLOAD_FOLDER)
        for file_name in zip_ref.namelist():
            contents.append(file_name)

    os.remove(zip_path)
    return jsonify({"message": "Zip file processed", "contents": contents})

def handle_excel(excel_path):
    try:
        df = pd.read_excel(excel_path)
        contents = df.to_dict(orient='records')
        os.remove(excel_path)
        return jsonify({"message": "Excel file processed", "contents": contents})
    except Exception as e:
        return jsonify({"error": f"Failed to process Excel file: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
