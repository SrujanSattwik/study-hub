# StudyClub — Deployment Guide

## Prerequisites

- Docker Desktop 24+ with Docker Compose v2
- A domain name (for production HTTPS)
- PostgreSQL credentials (generated or managed)
- Gmail App Password or transactional email provider
- Google Gemini API key

---

## 1. Docker Compose Deployment

### Step 1 — Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/study-hub.git
cd study-hub
```

### Step 2 — Configure Environment

```bash
cp .env.production.example .env
```

Edit `.env` and fill in **all** required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `JWT_SECRET` | ✅ | Min 64 chars — `openssl rand -hex 32` |
| `MAIL_USER` | ✅ | SMTP email address |
| `MAIL_PASS` | ✅ | SMTP password or app password |
| `GEMINI_API_KEY` | ✅ | Google AI Studio key |
| `CORS_ORIGINS` | ✅ | Your domain URL(s) |
| `VITE_API_URL` | ✅ | Public backend API URL |

### Step 3 — Build and Start

```bash
# Build all images and start in detached mode
docker compose up -d --build

# Verify all services are running
docker compose ps
```

Expected output:
```
NAME                    STATUS
studyclub_postgres      running (healthy)
studyclub_backend       running (healthy)
studyclub_frontend      running
```

### Step 4 — Verify Health

```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 42,
  "version": "1.0.0",
  "env": "production"
}
```

### Step 5 — Seed Initial Data (First Deploy Only)

```bash
# Run seed inside the backend container
docker compose exec backend npx prisma db seed --schema ./prisma/schema.prisma
```

---

## 2. Environment Variables Reference

### Backend (required at runtime)

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/study_club
JWT_SECRET=<64+ char random string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DAYS=7
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=<smtp password>
GEMINI_API_KEY=<key>
CORS_ORIGINS=https://yourdomain.com
```

### Docker Compose (for postgres service)

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong password>
POSTGRES_DB=study_club
```

### Frontend (baked in at build time)

```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## 3. Production HTTPS (Reverse Proxy)

For production with HTTPS, place Nginx or Caddy in front:

### Option A — Caddy (recommended — automatic HTTPS)

```caddyfile
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:80
}

api.yourdomain.com {
    reverse_proxy localhost:3001
}
```

```bash
caddy run --config /etc/caddy/Caddyfile
```

### Option B — Nginx with Let's Encrypt

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    # ... ssl certs ...
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # Required for Socket.io
    }
}
```

---

## 4. Database Operations in Production

```bash
# Apply new migrations (safe — no data loss)
docker compose exec backend npx prisma migrate deploy --schema ./prisma/schema.prisma

# Backup database
docker compose exec postgres pg_dump -U postgres study_club -Fc -Z9 > backup.dump

# Restore database
docker compose exec -T postgres pg_restore -U postgres -d study_club --clean < backup.dump
```

---

## 5. CI/CD Pipeline (GitHub Actions)

The pipeline in `.github/workflows/ci.yml` runs automatically on every push to `main`:

**Backend job:**
1. Install dependencies (npm cached)
2. Validate Prisma schema
3. TypeScript build
4. Run Vitest tests

**Frontend job:**
1. Install dependencies (npm cached)
2. TypeScript type check
3. Vite build
4. Run Vitest tests

The pipeline **fails** on any build error, type error, or test failure, preventing broken code from reaching main.

To add deployment steps, extend `ci.yml` with a `deploy` job that triggers only on `main` after CI passes.

---

## 6. Monitoring

### Health Check Endpoint

```
GET /health → 200 OK (healthy) | 503 Service Unavailable (degraded)
```

Configure your uptime monitor (UptimeRobot, Better Uptime, etc.) to poll `/health` every 60 seconds and alert on non-200 responses.

### Application Logs

```bash
# Stream live logs
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Logs are structured JSON in production (Winston)
# Integrate with: Datadog, Grafana Loki, AWS CloudWatch
```

### Error Tracking

Recommended integrations (add to backend):
- **Sentry** — `npm install @sentry/node` — captures exceptions with stack traces
- **Datadog APM** — distributed tracing

---

## 7. Useful Operational Commands

```bash
# Rolling restart (no downtime)
docker compose up -d --no-deps --build backend

# View resource usage
docker stats

# Prune unused images after builds
docker image prune -f

# Shell into running container
docker compose exec backend sh
docker compose exec postgres psql -U postgres study_club

# Stop all services
docker compose down

# Stop and remove all data volumes (DESTRUCTIVE)
docker compose down -v
```

---

## 8. Production Checklist

- [ ] `JWT_SECRET` is at least 64 characters and cryptographically random
- [ ] `POSTGRES_PASSWORD` is strong (20+ chars)
- [ ] `.env` is in `.gitignore` and never committed
- [ ] HTTPS is configured via reverse proxy
- [ ] `CORS_ORIGINS` is set to your actual domain (not `*`)
- [ ] Health check is monitored externally
- [ ] Database backups are scheduled and tested
- [ ] `NODE_ENV=production` is set
- [ ] Log aggregation is configured
- [ ] Rate limiting is active (enabled by default)
