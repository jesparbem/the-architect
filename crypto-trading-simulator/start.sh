#!/bin/bash
echo "Starting Crypto AI Trader..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python3 required"
    exit 1
fi

# Setup backend
echo "Setting up backend..."
cd /home/user/the-architect/crypto-trading-simulator/backend
pip install -r requirements.txt -q
echo "Backend dependencies installed"
echo ""

# Start backend in background
echo "Starting backend server..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"
sleep 2

# Setup frontend
cd /home/user/the-architect/crypto-trading-simulator/frontend
echo "Installing frontend dependencies..."
npm install -q
echo "Frontend dependencies installed"
echo ""

echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "================================================"
echo "  CRYPTO AI TRADER - LIVE!"
echo "  Dashboard: http://localhost:5173"
echo "  API: http://localhost:8000"
echo "  Starting capital: \$50.00"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
