#!/bin/bash

# ElderCare Advanced - Quick Start Script
# This script will start all services for you

echo "🏥 ElderCare Advanced Platform - Quick Start"
echo "=============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop first:"
    echo "  1. Open Docker Desktop from Applications"
    echo "  2. Wait for the whale icon to appear in your menu bar"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "🛑 Stopping any existing containers..."
docker-compose down

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy (30 seconds)..."
sleep 30

echo ""
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "🔧 Initializing database..."
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "🌐 Access your platform at:"
echo "   Landing Page: http://localhost:7500"
echo "   API Docs:     http://localhost:7501/api/docs"
echo "   Smart Home:   http://localhost:7502"
echo "   Monitoring:   http://localhost:4100"
echo ""
echo "🔐 Login credentials:"
echo "   Email:    admin@eldercare.com"
echo "   Password: admin123"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop all:  docker-compose down"
echo ""
