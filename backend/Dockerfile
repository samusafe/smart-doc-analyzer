# Backend Dockerfile (Go)
# syntax=docker/dockerfile:1.7

# Base stage with dependencies
FROM golang:1.24-alpine AS deps
WORKDIR /src
RUN apk add --no-cache git build-base
COPY go.mod go.sum ./
RUN go mod download

# Development stage with Air for hot-reloading
FROM deps AS development
RUN go install github.com/air-verse/air@latest
COPY . .
EXPOSE 8080
CMD ["air", "-c", ".air.toml"]

# Builder stage for production
FROM deps AS builder
COPY . .
ARG RUN_TESTS=true
RUN if [ "$RUN_TESTS" = "true" ]; then go test ./... -count=1; fi
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
RUN go build -ldflags="-s -w -X main.gitCommit=$GIT_COMMIT -X main.buildTime=$BUILD_TIME" -o server cmd/api/main.go

# Production stage (final, optimized image)
FROM alpine:3.20 AS production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app \
    && apk add --no-cache ca-certificates tzdata
COPY --from=builder /src/server ./server
ENV PORT=8080 GIN_MODE=release
EXPOSE 8080
USER app
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
CMD ["./server"]
