.PHONY: help install up down restart logs clean db-migrate db-seed db-studio test

help:
	@echo "ElderCare Platform - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo "  make up          - Start all services with Docker"
	@echo "  make down        - Stop all services"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development servers (without Docker)"
	@echo "  make logs        - View container logs"
	@echo "  make restart     - Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-seed     - Seed database with demo data"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo "  make db-reset    - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-backend - Run backend tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Remove node_modules and build artifacts"

install:
	cd .. && npm install
	cd ../backend && npm install
	cd ../frontend && npm install

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

dev:
	cd .. && npm run dev

db-migrate:
	cd ../backend && npx prisma migrate dev

db-seed:
	cd ../backend && npm run seed

db-studio:
	cd ../backend && npx prisma studio

db-reset:
	cd ../backend && npx prisma migrate reset

test:
	cd .. && npm run test

test-backend:
	cd ../backend && npm run test

clean:
	rm -rf ../node_modules
	rm -rf ../backend/node_modules
	rm -rf ../frontend/node_modules
	rm -rf ../backend/dist
	rm -rf ../frontend/.next
