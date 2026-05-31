# Task Tracker — Monorepo

A full-stack team task tracker with JWT auth, RBAC, Kanban board, MongoDB, Redis, and Docker.

## Structure

```
assignment/
├── backend/     ← Express + TypeScript + MongoDB + Redis API
└── frontend/    ← React + Vite + TypeScript Kanban UI
```

## Quick Start (Docker)

```bash
# Copy environment file
cp backend/.env.example backend/.env

# Start everything (MongoDB + Redis + API + React UI)
docker compose -f backend/docker-compose.yml up
```

- **Frontend**: http://localhost
- **API / Swagger**: http://localhost:3000/api/docs

## Local Development

```bash
# Backend
cd backend
npm install
npm run db:seed   # seed demo data (needs MongoDB running)
npm run dev       # starts on http://localhost:3000

# Frontend
cd frontend
npm install
npm run dev       # starts on http://localhost:5173 (proxied to :3000)
```

## Demo Credentials

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| ADMIN   | admin@demo.com      | Admin123    |
| MANAGER | manager@demo.com    | Manager123  |
| MEMBER  | member@demo.com     | Member123   |
