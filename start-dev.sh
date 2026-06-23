#!/bin/bash

# Start NeighborFit in development mode
echo "🚀 Starting NeighborFit Development Servers..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start server in background
echo "📡 Starting backend server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client in background
echo "🌐 Starting frontend client..."
cd client && npm run dev &
CLIENT_PID=$!

echo "✅ Both servers are starting..."
echo "📡 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
