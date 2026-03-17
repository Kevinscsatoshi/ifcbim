#!/bin/bash
set -e

echo "========================================="
echo "  CAD2BIM Studio - Setup & Launch"
echo "========================================="

# Go to project root
cd "$(dirname "$0")"

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "[1/3] Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate and install
echo "[2/3] Installing dependencies..."
source .venv/bin/activate
pip install -r requirements.txt -q

# Run test
echo "[3/3] Running pipeline test..."
python tests/test_pipeline.py

if command -v ODAFileConverter >/dev/null 2>&1; then
    echo "[info] ODA File Converter detected. DWG upload is enabled."
else
    echo "[info] ODA File Converter not found. DXF upload works now; DWG upload requires ODA."
fi

echo ""
echo "========================================="
echo "  Starting web server..."
echo "  Open http://localhost:8000"
echo "========================================="
python main.py
