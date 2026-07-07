# ═══════════════════════════════════════════════════════════
# Stage 1 — Build
# Build context: repo root (set in docker-compose.yml)
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY backend/package*.json ./
RUN npm ci --omit=dev=false

# Copy Prisma schema (lives at repo root /prisma)
COPY prisma/ ./prisma/

# Generate Prisma client into node_modules
RUN npx prisma generate --schema ./prisma/schema.prisma

# Copy backend source and compile TypeScript
COPY backend/ .
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2 — Production Runner
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built artefacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Prisma schema needed for migrate deploy on startup
COPY --from=builder /app/prisma ./prisma

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/server.js"]
