# Frontend Dockerfile (Next.js)
# syntax=docker/dockerfile:1.7

# Base stage
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Development stage
FROM base AS development
WORKDIR /app
COPY . .
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage (final, optimized image)
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/package.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["npm", "run", "start"]
