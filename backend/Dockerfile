# Backend Dockerfile

# Build stage
FROM golang:1.23-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN go build -ldflags="-s -w" -o server cmd/api/main.go

# Final stage
FROM alpine:latest
WORKDIR /app

# Copy binary
COPY --from=builder /app/server .

# Expose port
EXPOSE 8080

# Run
CMD ["./server"]
