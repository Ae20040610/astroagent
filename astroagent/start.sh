#!/bin/bash
# AstroAgent — Start all services

echo "✦ Starting AstroAgent..."

# Backend
echo ""
echo "→ Starting backend on http://localhost:8000"
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

if [ ! -f ".env" ]; then
  echo ""
  echo "⚠  No .env file found!"
  echo "   Copy backend/.env.example to backend/.env and add your API key."
  exit 1
fi

# Build RAG index if not already built
if [ ! -d "rag/chroma_db" ]; then
  echo "  Building knowledge base..."
  python -m rag.vectorstore
fi

# Start backend in background
uvicorn api.main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo ""
echo "→ Starting frontend on http://localhost:5173"
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✦ AstroAgent is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
