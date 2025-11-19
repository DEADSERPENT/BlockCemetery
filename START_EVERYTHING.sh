#!/bin/bash

# Cemetery Blockchain - One-Click Startup Script
# This script starts all services needed for the application

echo "🏗️  Cemetery Blockchain - Starting All Services"
echo "=============================================="
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "✅ All dependencies installed!"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating backend .env file..."
    cat > backend/.env << EOF
PORT=3001
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RPC_URL=http://127.0.0.1:8545
EOF
    echo "✅ Backend .env created!"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚙️  Creating frontend .env file..."
    cat > frontend/.env << EOF
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_API_URL=http://localhost:3001
EOF
    echo "✅ Frontend .env created!"
fi

echo ""
echo "🚀 Starting services..."
echo ""
echo "📌 Instructions:"
echo "   1. Hardhat node will start (keep running)"
echo "   2. Contracts will be deployed automatically"
echo "   3. Backend API will start on port 3001"
echo "   4. Frontend will start on port 5173"
echo ""
echo "   Open browser to: http://localhost:5173"
echo "   Connect MetaMask to Hardhat Local (Chain ID: 1337)"
echo ""
echo "   Press Ctrl+C to stop all services"
echo ""
echo "=============================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Hardhat node in background
echo "1️⃣  Starting Hardhat node..."
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!
sleep 5

# Deploy contracts
echo "2️⃣  Deploying smart contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Start backend
echo "3️⃣  Starting backend API..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Start frontend
echo "4️⃣  Starting frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📡 Services:"
echo "   - Hardhat Node: http://127.0.0.1:8545"
echo "   - Backend API:  http://localhost:3001"
echo "   - Frontend:     http://localhost:5173"
echo ""
echo "🔍 View logs:"
echo "   - Hardhat:  tail -f hardhat.log"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
