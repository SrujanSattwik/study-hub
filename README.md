<div align="center">

# 📚 StudyClub

**A modern collaborative learning platform for students.**

Connect with peers, share materials, discuss questions, and study smarter — together.

[![CI](https://github.com/YOUR_USERNAME/study-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/study-hub/actions)
![Node](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

</div>

---

## ✨ Features

- 🔐 **JWT Auth** — Secure login with OTP email verification and refresh token rotation
- 📁 **Materials Hub** — Upload, browse, and download study resources
- 💬 **Community** — Real-time group chat with Socket.io
- 🎨 **Collaborative Canvas** — Shared whiteboard for visual learning
- 🤖 **KnowNook AI** — Gemini-powered doubt solver
- 📅 **Syllabus Scheduler** — Drag-and-drop study planner
- 📢 **Notifications** — Real-time alerts for group activity

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT (access) + HttpOnly cookies (refresh) |
| AI | Google Gemini API |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/study-hub.git
cd study-hub
```

### 2. Configure Environment

```bash
# Backend
cp .env.development.example backend/.env
# Edit backend/.env with your database credentials and secrets
```

### 3. Database Setup

```bash
# Apply migrations
cd backend && npm run prisma:migrate

# Seed development data (4 users, 4 groups, materials, chat messages)
cd .. && npx prisma db seed
```

### 4. Start Development Servers

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  
Health check: http://localhost:3001/health

### 5. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | alice@studyhub.dev | StudyHub@2026 |
| Student | bob@studyhub.dev | StudyHub@2026 |
| Student | carol@studyhub.dev | StudyHub@2026 |

---

## 🐳 Docker

### Start Everything

```bash
# 1. Create your env file
cp .env.production.example .env
# Edit .env — set JWT_SECRET, POSTGRES_PASSWORD, MAIL_PASS, GEMINI_API_KEY

# 2. Build and start all services
docker compose up -d --build

# 3. Check status
docker compose ps
curl http://localhost:3001/health
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

### Useful Commands

```bash
docker compose logs -f backend       # Stream backend logs
docker compose logs -f frontend      # Stream frontend logs
docker compose down                  # Stop all services
docker compose down -v               # Stop and remove volumes (destroys DB data)
docker compose exec backend sh       # Shell into backend container
docker compose exec postgres psql -U postgres study_club  # psql prompt
```

---

## 🧪 Testing

```bash
# Backend — unit + integration tests (Vitest + Supertest)
cd backend && npm test

# Frontend — component + routing tests (Vitest + React Testing Library)
cd frontend && npm test

# Coverage report
cd backend && npm run test:coverage
```

---

## 🗄 Database

```bash
# Run pending migrations (development)
cd backend && npm run prisma:migrate

# Run migrations (production / CI)
cd backend && npm run prisma:deploy

# Open Prisma Studio (GUI)
cd backend && npm run prisma:studio

# Re-seed development data
npx prisma db seed    # from repo root
```

See [docs/DATABASE.md](docs/DATABASE.md) for backup and restore instructions.

---

## 📖 Documentation

| Doc | Description |
|-----|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flows |
| [docs/API.md](docs/API.md) | REST API endpoint reference |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema design and database operations |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |

---

## 📁 Project Structure

```
study-hub/
├── backend/            # Express TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── database/
│   │   ├── validators/
│   │   └── utils/
│   └── Dockerfile
├── frontend/           # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── types/
│   ├── Dockerfile
│   └── nginx.conf
├── prisma/             # Database schema + migrations
│   └── schema.prisma
├── docs/               # Documentation
├── docker-compose.yml
└── .github/workflows/  # CI/CD
```

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.
