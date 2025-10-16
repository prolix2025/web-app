from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder="static", template_folder="templates", static_url_path="/static")

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/api/extract")
def extract():
    """
    Receive a file upload and return extracted data (stub).
    Replace the 'fake' section with real extraction logic later.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Example: save to a temp folder if you need
    # save_path = Path("tmp") / f.filename
    # save_path.parent.mkdir(exist_ok=True)
    # f.save(save_path)

    fake = {
        "fileName": f.filename,
        "contentType": f.mimetype or "unknown",
        "sizeBytes": request.content_length or 0,
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "sampleFields": {
            "invoiceId": "INV-001234",
            "vendor": "Contoso Ltd.",
            "total": "$1,234.56",
            "dueDate": "2025-11-30"
        }
    }
    return jsonify(fake)

if __name__ == "__main__":
    # For local debugging only
    app.run(host="0.0.0.0", port=8000, debug=True)
