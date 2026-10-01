# ── Stage 1: Build the React Application ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and fix-bins script
COPY package*.json ./
COPY scripts/ ./scripts/

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build argument for backend API URL (baked into client-side JS bundle by Vite)
ARG VITE_BACKEND_URL=http://localhost:8001
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration with SPA fallback and port 5174
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5174

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5174/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
