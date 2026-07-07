# ═══════════════════════════════════════════════════════════
# Stage 1 — Build Vite App
# Build context: repo root (set in docker-compose.yml)
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API URL as build argument so it's baked into the bundle
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2 — Serve with Nginx
# ═══════════════════════════════════════════════════════════
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles SPA routing)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
