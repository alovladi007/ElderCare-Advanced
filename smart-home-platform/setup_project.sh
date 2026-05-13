#!/bin/bash

echo "Setting up Smart Home Platform..."

# Create directory structure
mkdir -p backend/routers
mkdir -p hub
mkdir -p smarthome-frontend/src/pages
mkdir -p smarthome-frontend/src/components
mkdir -p smarthome-frontend/src/services
mkdir -p smarthome-frontend/public

echo "✓ Directories created"

# Backend files already created:
# - backend/requirements.txt
# - backend/database.py
# - backend/main.py
# - backend/models.py
# - backend/auth.py
# - backend/Dockerfile

echo "✓ Backend base files ready"
echo "Next: Run docker-compose up --build"
echo "Platform will be available at:"
echo "  - Backend: http://localhost:9000"
echo "  - Hub: http://localhost:9001"
echo "  - Frontend: http://localhost:9002"

