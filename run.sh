#!/usr/bin/env bash
set -e

echo "=================================================="
echo "    Starting AttendAI — Missed Appointment Predictor"
echo "=================================================="

# Determine workspace directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Setup Backend Python Environment
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# 2. Train Model if not present
if [ ! -f "backend/models/no_show_model.pkl" ]; then
    echo "Training ML prediction model..."
    backend/venv/bin/python backend/ml/train.py
fi

# 3. Seed Database if database doesn't exist
if [ ! -f "attendai.db" ]; then
    echo "Seeding clinical database with patients and appointments..."
    PYTHONPATH=. backend/venv/bin/python -m backend.app.seed
fi

# 4. Install Frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "Starting Backend API on http://127.0.0.1:8000 ..."
PYTHONPATH=. backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend UI on http://127.0.0.1:5173 ..."
cd frontend && npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "AttendAI is active!"
echo "• Dashboard & Web App: http://127.0.0.1:5173"
echo "• Backend Swagger Docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to stop both servers."

wait
