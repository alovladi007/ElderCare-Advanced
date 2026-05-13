# ElderCare Advanced Platform v2.0

A production-grade elder care platform supporting 24/7 personal care, remote health monitoring, medication management, memory care, and comprehensive health monitoring.

## 🏗️ Architecture

This is a TypeScript monorepo with:

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Shared**: Common types and utilities
- **Infrastructure**: Docker setup for local development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm 9+

### Local Development Setup

1. **Clone and Install Dependencies**

```bash
cd platform
npm run install:all
```

2. **Start PostgreSQL with Docker**

```bash
npm run docker:up
```

3. **Set Up Environment Variables**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your configuration
```

4. **Run Database Migrations**

```bash
npm run db:migrate
```

5. **Seed Demo Data**

```bash
npm run db:seed
```

6. **Start Development Servers**

```bash
npm run dev
```

- Backend API: http://localhost:4000
- Frontend: http://localhost:3000
- Database Studio: `npm run db:studio` → http://localhost:5555

### Demo Users

After seeding, you can log in as:

| Role | Email | Password |
|------|-------|----------|
| Elder | elder@demo.com | Elder123! |
| Family Member | family@demo.com | Family123! |
| Caregiver | caregiver@demo.com | Caregiver123! |
| Clinician | clinician@demo.com | Clinician123! |
| Admin | admin@demo.com | Admin123! |

## 📦 Project Structure

```
platform/
├── backend/           # NestJS API
│   ├── prisma/       # Database schema & migrations
│   ├── src/
│   │   ├── auth/     # Authentication & RBAC
│   │   ├── users/    # User management
│   │   ├── elders/   # Elder profiles & care teams
│   │   ├── care-plans/      # Care plans & tasks
│   │   ├── medications/     # Medication management
│   │   ├── vitals/          # Vitals & devices
│   │   ├── alerts/          # Alert system
│   │   ├── memory-care/     # Memory care features
│   │   ├── assessments/     # Health assessments
│   │   ├── nutrition/       # Nutrition & meal planning
│   │   └── notifications/   # Notification service
│   └── test/
├── frontend/         # Next.js 14 App
│   ├── app/         # App router pages
│   │   ├── (auth)/  # Auth pages
│   │   ├── elder/   # Elder dashboard
│   │   ├── family/  # Family dashboard
│   │   ├── caregiver/   # Caregiver dashboard
│   │   ├── clinician/   # Clinician dashboard
│   │   └── admin/       # Admin panel
│   ├── components/  # Reusable components
│   └── lib/        # Utilities & API client
├── shared/         # Shared TypeScript types
├── infra/          # Docker & deployment configs
└── package.json    # Monorepo root
```

## 🎯 Core Features

### 1. **24/7 Personal Care**
- Care plan creation and management
- Task scheduling (ADLs, IADLs)
- Real-time task tracking
- Incident reporting

### 2. **Remote Health Monitoring**
- Device integration framework
- Manual vital entry
- Continuous monitoring
- Alert rules engine

### 3. **Medication Management**
- Medication schedules
- Administration logging
- Adherence tracking
- Critical med alerts

### 4. **Memory Care**
- Orientation dashboard
- Daily routine cards
- Behavior logging
- Wandering event tracking

### 5. **Health Monitoring**
- Clinical assessments
- Care notes
- Appointment scheduling
- Multi-role coordination

### 6. **Nutrition & Meal Planning**
- Dietary profiles
- Weekly meal plans
- Intake logging
- Calorie tracking

## 👥 User Roles

1. **Elder/Patient**: Simplified view of daily schedule, medications, orientation screen
2. **Family Member**: Overview dashboard, alerts, activity timeline, adherence reports
3. **Caregiver**: Task list, vital entry, med administration, incident logging
4. **Clinician**: Clinical overview, vitals charts, assessments, care notes
5. **Admin**: User management, system configuration

## 🔧 Development

### Run Tests

```bash
npm run test
```

### Database Management

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset

# View database in browser
npm run db:studio
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:4000/api/docs
- API Health: http://localhost:4000/health

## 🔐 Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Row-level security (users can only access assigned elders)
- Input validation with class-validator
- Helmet.js security headers
- CORS configuration

## 📝 License

MIT

## 🤝 Support

For issues and questions, see [SUPPORT.md](./SUPPORT.md)
