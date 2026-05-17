#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}ElderCare Advanced - Development Server${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
    sleep 2
fi

if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠ Could not start PostgreSQL automatically${NC}"
    echo "Please start PostgreSQL manually and run this script again"
    exit 1
fi

# Function to kill processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo ""
echo -e "${YELLOW}Starting Backend API...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend API started on http://localhost:8080${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        cat logs/backend.log
        cleanup
    fi
done

# Start frontend
echo ""
echo -e "${YELLOW}Starting Frontend...${NC}"
cd client
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8082 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend started on http://localhost:8082${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Frontend failed to start${NC}"
        cat logs/frontend.log
        cleanup
    fi
done

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🚀 ElderCare Advanced is running!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "Frontend:  ${BLUE}http://localhost:8082${NC}"
echo -e "Backend API: ${BLUE}http://localhost:8080${NC}"
echo -e "API Docs:  ${BLUE}http://localhost:8080/api/docs${NC}"
echo -e "WebSocket: ${BLUE}ws://localhost:8081${NC}"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo "Admin: admin@eldercare.com / admin123"
echo "Family: family@example.com / password123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Tail logs
tail -f logs/backend.log logs/frontend.log
