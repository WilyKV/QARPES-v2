# ============================================================================
# STAGE: base
# Common foundation for all stages
# ============================================================================
FROM node:22-alpine AS base
WORKDIR /app

# Install latest npm globally
RUN npm install -g npm@latest

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Copy Prisma schema (needed for postinstall hook)
COPY prisma ./prisma

# ============================================================================
# STAGE: dependencies
# Separate stage to cache dependency installation
# ============================================================================
FROM base AS dependencies
RUN npm ci --include=dev

# ============================================================================
# STAGE: development
# Target for local development with hot reload
# ============================================================================
FROM dependencies AS development

# Set development environment
ENV NODE_ENV=development

# Copy configuration files
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY .env* ./

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code (will be overridden by volume mounts in docker-compose)
COPY server ./server
COPY client ./client
COPY shared ./shared

# Copy development entrypoint script
COPY docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.dev.sh

# Expose dev server ports (8080=backend, 5173=vite, 5555=prisma studio)
EXPOSE 8080 5173 5555

# Auto-start development server on container startup
CMD ["docker-entrypoint.dev.sh"]

# ============================================================================
# STAGE: builder
# Compiles TypeScript backend and builds Vite frontend
# ============================================================================
FROM dependencies AS builder

# Copy source and config files
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY prisma ./prisma
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY scripts ./scripts

# Generate Prisma client
RUN npx prisma generate

# Build backend (TypeScript compilation to dist/server/)
RUN npm run build:backend

# Build frontend (Vite build to dist/public/)
RUN npm run build:frontend

# ============================================================================
# STAGE: production (default final stage)
# Minimal production image with only runtime dependencies
# ============================================================================
FROM node:22-alpine AS production
WORKDIR /app

# Copy package files and Prisma schema (needed for postinstall hook)
COPY package.json package-lock.json ./
COPY --from=builder /app/prisma ./prisma

# Install ONLY production dependencies (postinstall will run prisma generate)
RUN npm ci --omit=dev --omit=optional

# Copy generated Prisma client from builder (in case postinstall didn't run)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled backend and frontend from builder
COPY --from=builder /app/dist ./dist

# Copy shared types (needed at runtime)
COPY --from=builder /app/shared ./shared

# Set production environment
ENV NODE_ENV=production

# Expose production port
EXPOSE 8080

# Start production server
CMD ["node", "dist/server/index.js"]
