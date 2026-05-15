#!/bin/bash

echo "========================================="
echo "ElderCare Advanced Platform Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"

    # Try to connect
    if psql -U postgres -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL is not running or connection failed${NC}"
        echo "  Please start PostgreSQL:  sudo systemctl start postgresql"
    fi
else
    echo -e "${RED}✗ PostgreSQL is not installed${NC}"
    echo "  Please install PostgreSQL: sudo apt-get install postgresql"
fi

# Create database if it doesn't exist
echo ""
echo "2. Setting up database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'eldercare_db'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE eldercare_db;" 2>/dev/null

# Create user if doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_user WHERE usename = 'eldercare'" | grep -q 1 || \
    psql -U postgres -c "CREATE USER eldercare WITH PASSWORD 'eldercare_password';" 2>/dev/null

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE eldercare_db TO eldercare;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created and configured${NC}"
else
    echo -e "${YELLOW}⚠ Database setup requires manual intervention${NC}"
fi

# Backend setup
echo ""
echo "3. Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ No .env file found, copying from .env.example${NC}"
    cp .env.example .env
fi

echo "Installing backend dependencies..."
npm install --silent

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend setup complete${NC}"
else
    echo -e "${RED}✗ Backend setup failed${NC}"
fi

# Frontend setup
echo ""
echo "4. Setting up frontend..."
cd ../client

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Creating frontend .env file${NC}"
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
VITE_APP_NAME=ElderCare Advanced
VITE_APP_VERSION=1.0.0
EOF
fi

echo "Installing frontend dependencies..."
npm install --silent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend setup complete${NC}"
else
    echo -e "${RED}✗ Frontend setup failed${NC}"
fi

cd ..

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your real Stripe API keys"
echo "2. Update backend/.env with your SendGrid API key"
echo "3. Start the backend:  cd backend && npm run dev"
echo "4. Start the frontend: cd client && npm run dev"
echo "5. Run tests:          ./test-features.sh"
echo ""
echo "Default URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- WebSocket: ws://localhost:3002"
echo ""
