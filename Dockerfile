# ── Multi-Stage Production Dockerfile for KnowNook (StudyHub) ──

# Stage 1: Build Backend & Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package definitions
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY prisma ./prisma/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY backend ./backend
COPY frontend ./frontend

# Build Backend and Frontend
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# Install production dependencies only
RUN cd backend && npm install --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/dist/server.js"]
