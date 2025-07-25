# Full-Stack Monorepo: Go API + Next.js Frontend

This repository contains a **backend** written in Go (Gin) and a **frontend** built with Next.js (TypeScript + Tailwind CSS), orchestrated together using Docker Compose.

## Project Structure

```
GolangAPI/
├─ backend/          # Go API with Gin framework
│  ├─ cmd/api/main.go
│  ├─ internal/      # configuration, handlers, middleware, routes, utils
│  ├─ go.mod
│  └─ Dockerfile
├─ frontend/         # Next.js application (TypeScript + Tailwind CSS)
│  ├─ pages/
│  ├─ public/
│  ├─ styles/
│  ├─ .env
│  ├─ next-env.d.ts
│  ├─ package.json
│  ├─ tailwind.config.js
│  └─ Dockerfile
├─ .env              # Shared environment variables (backend & Docker Compose)
├─ .gitignore
└─ docker-compose.yml
```

## Prerequisites

- Docker

## Environment Variables

1. Create a file named `.env` in the project root:

   ```dotenv
   # Backend & Docker Compose
   PORT=8080

   # Exposed API URL for the frontend inside Docker network
   NEXT_PUBLIC_API_URL=http://backend:8080
   ```

2. For local frontend development, create `frontend/.env.local`:
   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

## Running the Application

From the project root, simply run:

```bash
docker compose up --build
```

This command will build and start two services:

- **backend** → Go API listening on `http://localhost:8080`
- **frontend** → Next.js app listening on `http://localhost:3000`

To stop the services:

```bash
docker compose down
```

## Main API Endpoints

- `GET /health` → Returns HTTP 200 OK
- `GET /users/me` → Returns HTTP 200 with authenticated user ID or 401 Unauthorized if no valid token is provided

## Tech Stack

- **Backend:** Go 1.23, Gin framework, Clerk SDK, Docker
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Nginx
- **Infra:** Docker Compose

---

Feel free to open an issue or submit a pull request for improvements.
