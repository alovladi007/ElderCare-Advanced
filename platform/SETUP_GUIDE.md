# ElderCare Advanced Platform - Setup Guide

## 🎯 What Has Been Built

This is a **production-grade elder care platform** built with:

- ✅ **Complete Database Schema** (48+ tables) with Prisma ORM
- ✅ **Authentication System** with JWT, RBAC, and role-based guards
- ✅ **NestJS Backend** with modular architecture
- ✅ **Docker Setup** for PostgreSQL, Redis, and services
- ✅ **User Management** with 5 role types
- ✅ **Elder Profiles & Overview** endpoints
- ✅ **Seed Data** with demo users for all roles

### Database Schema Includes:

1. **Users & Roles**: Elder, Family, Caregiver, Clinician, Admin
2. **Care Plans & Tasks**: ADL tracking, task scheduling, incident reporting
3. **Medication Management**: Schedules, administration logs, adherence tracking
4. **Vitals & Devices**: Device management, vital readings, alert rules
5. **Memory Care**: Orientation cards, behavior logs, wandering events
6. **Assessments**: Templates and instances for health monitoring
7. **Nutrition**: Dietary profiles, meal plans, intake logging
8. **Alerts & Notifications**: Multi-severity alert system

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Step 1: Install Dependencies

```bash
cd /home/user/ElderCare-Advanced/platform

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Return to platform root
cd ..
```

### Step 2: Start PostgreSQL

```bash
# From platform directory
cd infra
docker-compose up -d postgres redis

# Or use the Makefile
make up
```

### Step 3: Configure Environment

```bash
cd backend
cp .env.example .env

# Edit .env with your settings (JWT_SECRET is required)
```

**Minimum required in `.env`:**
```env
DATABASE_URL="postgresql://eldercare:eldercare_dev_password@localhost:5432/eldercare_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-at-least-32-characters-long"
```

### Step 4: Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init

# This will:
# - Create all database tables
# - Generate Prisma Client
```

### Step 5: Seed Demo Data

```bash
npm run seed

# Creates demo users:
# - admin@demo.com / Demo123!
# - elder@demo.com / Demo123!
# - family@demo.com / Demo123!
# - caregiver@demo.com / Demo123!
# - clinician@demo.com / Demo123!
```

### Step 6: Start the Backend

```bash
# Development mode with hot reload
npm run start:dev

# The API will start on http://localhost:4000
```

### Step 7: Test the API

**Option 1: Swagger UI**
Open http://localhost:4000/api/docs in your browser

**Option 2: curl**
```bash
# Register a new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "FAMILY"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo123!"
  }'

# Use the returned accessToken for authenticated requests
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/me/elders` - Get assigned elders
- `GET /api/users/:id` - Get user by ID

### Elders
- `GET /api/elders` - List all elders
- `GET /api/elders/:id` - Get elder profile
- `GET /api/elders/:id/overview` - Get comprehensive overview (vitals, meds, alerts)

### Health Check
- `GET /health` - System health check

## 🏗️ Module Status

| Module | Status | Description |
|--------|--------|-------------|
| Auth | ✅ Complete | JWT authentication, RBAC, guards |
| Users | ✅ Complete | User management and profiles |
| Elders | ✅ Complete | Elder profiles and overview |
| Care Plans | 🚧 Stub | Ready for implementation |
| Medications | 🚧 Stub | Ready for implementation |
| Vitals | 🚧 Stub | Ready for implementation |
| Alerts | 🚧 Stub | Ready for implementation |
| Memory Care | 🚧 Stub | Ready for implementation |
| Assessments | 🚧 Stub | Ready for implementation |
| Nutrition | 🚧 Stub | Ready for implementation |
| Notifications | 🚧 Stub | Ready for implementation |

## 📝 Next Steps to Complete

### 1. Care Plans Module
Implement:
- `POST /api/care-plans` - Create care plan
- `GET /api/care-plans/:id/tasks` - Get tasks for date
- `PATCH /api/tasks/:id/complete` - Mark task complete
- Task scheduler service (cron job to generate daily tasks)

### 2. Medications Module
Implement:
- `POST /api/medications` - Add medication
- `GET /api/elders/:id/medications/today` - Today's med schedule
- `POST /api/medications/log` - Log administration
- `GET /api/medications/adherence` - Adherence report

### 3. Vitals Module
Implement:
- `POST /api/vitals` - Record vital reading
- `GET /api/elders/:id/vitals` - Get vitals with filters
- Alert evaluation service (check rules on new readings)

### 4. Memory Care Module
Implement:
- `GET /api/elders/:id/orientation` - Get orientation dashboard
- `POST /api/behavior-logs` - Log behavior
- Orientation card management

### 5. Frontend (Next.js)
Create:
- Authentication pages
- Role-specific dashboards (Elder, Family, Caregiver, Clinician)
- Component library with Tailwind CSS

## 🛠️ Development Tools

### Prisma Studio (Database GUI)
```bash
cd backend
npx prisma studio
```
Opens at http://localhost:5555

### Database Commands
```bash
# Create a migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

### Running Tests
```bash
cd backend
npm run test
```

## 🔒 Security Notes

1. **JWT_SECRET**: Change this in production! Use a strong 32+ character secret
2. **Database Password**: Update the PostgreSQL password in docker-compose.yml
3. **CORS**: Update `FRONTEND_URL` in .env for production
4. **HTTPS**: Always use HTTPS/SSL in production

## 📖 Architecture Overview

```
platform/
├── backend/               # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma # Complete database schema
│   │   └── seed.ts       # Demo data seeding
│   ├── src/
│   │   ├── auth/         # ✅ Authentication & JWT
│   │   ├── users/        # ✅ User management
│   │   ├── elders/       # ✅ Elder profiles
│   │   ├── care-plans/   # 🚧 To implement
│   │   ├── medications/  # 🚧 To implement
│   │   ├── vitals/       # 🚧 To implement
│   │   └── ...           # Other modules
│   └── test/
├── frontend/             # Next.js (to be created)
├── shared/               # Shared types (to be created)
└── infra/                # Docker configs
```

## 🐛 Troubleshooting

### "Can't reach database server"
- Ensure PostgreSQL is running: `docker ps`
- Check DATABASE_URL in .env
- Try: `docker-compose down && docker-compose up -d postgres`

### "Prisma Client not found"
```bash
cd backend
npx prisma generate
```

### Port 4000 already in use
Change PORT in backend/.env

### Migration errors
```bash
cd backend
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
npm run seed
```

## 📞 Support

For issues with the platform setup:
1. Check the error logs
2. Verify all environment variables are set
3. Ensure Docker containers are running
4. Check Prisma migration status

## 🎓 Learning Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Built with ❤️ for elder care**
