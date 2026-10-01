# ── Stage 1: Build the React Application ─────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and fix-bins script
COPY package*.json ./
COPY scripts/ ./scripts/

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build argument for backend API URL (baked into client-side JS bundle by Vite)
ARG VITE_BACKEND_URL=http://localhost:8001
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Default port to 5174 for local runs; Render overrides $PORT dynamically
ENV PORT=5174

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx template (Nginx automatically substitutes ${PORT} into /etc/nginx/conf.d/default.conf on startup)
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 5174

CMD ["nginx", "-g", "daemon off;"]
