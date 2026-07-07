# Environment Variables Setup

Copy `.env.example` to `.env` and fill in the values.

## Required Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/study_hub` |
| `JWT_SECRET` | Secret for signing JWT access tokens — **minimum 32 chars** | `super-secret-key-at-least-32-characters-long` |

## Optional Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `ACCESS_TOKEN_EXPIRY` | `15m` | JWT access token lifetime (e.g. `15m`, `1h`) |
| `REFRESH_TOKEN_EXPIRY_DAYS` | `30` | Refresh token lifetime in days |
| `MAIL_USER` | — | Gmail address for OTP emails |
| `MAIL_PASS` | — | Gmail app password (not account password) |
| `GEMINI_API_KEY` | — | Google Gemini AI API key |
| `CORS_ORIGINS` | Dev defaults | Comma-separated allowed origins, e.g. `https://app.studyhub.io` |
| `COOKIE_DOMAIN` | — | Cookie domain for cross-subdomain auth (production) |

## Production Checklist

- [ ] `JWT_SECRET` is at least 32 random characters (use `openssl rand -hex 32`)
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` set to your production frontend URL only
- [ ] `COOKIE_DOMAIN` set to your production domain
- [ ] `MAIL_USER` and `MAIL_PASS` configured (otherwise OTP only logs to console)
- [ ] `GEMINI_API_KEY` set for AI features
- [ ] Database is backed up before running `prisma migrate deploy`

## Development Setup

```bash
# 1. Copy example env
cp .env.example .env

# 2. Edit .env with your local database URL and JWT secret

# 3. Apply migrations
npm run prisma:deploy

# 4. Seed test data
npm run prisma:seed

# 5. Start dev server
npm run dev
```

## Test Accounts (after seeding)

All test accounts use password: `StudyHub@2026`

| Role | Email |
|---|---|
| admin | alice@studyhub.dev |
| student | bob@studyhub.dev |
| student | carol@studyhub.dev |
| student | david@studyhub.dev |
