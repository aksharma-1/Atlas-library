# Atlas Library Management SaaS

A multi-tenant web platform for managing study-space libraries. Built for competitive-exam aspirants and the owners who serve them.

> **Phase 1 — Foundation.** This phase establishes the monorepo, toolchain, and backend server. Business modules (students, seats, memberships, payments) follow in Phase 2+.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Structure](#repository-structure)
3. [Installation](#installation)
4. [Environment Setup](#environment-setup)
5. [MongoDB (Local Development)](#mongodb-local-development)
6. [Running the Application](#running-the-application)
7. [Running Tests](#running-tests)
8. [API Reference](#api-reference)
9. [Code Quality](#code-quality)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Required Version | Check |
|---|---|---|
| Node.js | ≥ 20.0.0 | `node --version` |
| npm | ≥ 9.0.0 | `npm --version` |
| MongoDB | ≥ 6.0 | `mongod --version` |
| Git | Any | `git --version` |

> This project was developed on **Node.js v24.16.0 / npm 9.6.4 / MongoDB 6.0.3** on Windows.

---

## Repository Structure

```
Library_project/
├── .env.example              ← All env vars documented here
├── .gitignore
├── .prettierrc.json
├── package.json              ← npm workspace root
├── README.md
│
├── apps/
│   ├── backend/              ← Express + Mongoose API
│   │   ├── .env.example      ← Backend env template (copy → .env)
│   │   ├── src/
│   │   │   ├── config/env.ts     ← Zod env validation
│   │   │   ├── db/connect.ts     ← Mongoose connection
│   │   │   ├── middleware/       ← 404 + error handlers
│   │   │   ├── routes/health.ts  ← GET /api/v1/health
│   │   │   ├── app.ts            ← Express factory
│   │   │   └── index.ts          ← Entry point
│   │   └── src/__tests__/        ← Supertest integration tests
│   │
│   └── frontend/             ← React + Vite SPA
│       └── src/
│           ├── App.tsx           ← Root component
│           └── __tests__/        ← Vitest + RTL tests
│
└── packages/
    └── shared/               ← Shared TypeScript types
        └── src/api/health.ts ← HealthResponse interface
```

---

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Library_project

# 2. Install all workspace dependencies in one step
npm install
```

`npm install` at the root installs dependencies for all workspaces (`apps/backend`, `apps/frontend`, `packages/shared`) and symlinks `@atlas/shared` locally.

---

## Environment Setup

### Backend

```bash
# Copy the template
cp apps/backend/.env.example apps/backend/.env

# Open the file and verify the values
notepad apps/backend\.env
```

**Minimum required variables:**

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `5000` | HTTP server port |
| `MONGODB_URI` | `mongodb://localhost:27017/atlas_dev` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

The backend **will not start** if any required variable is missing. It exits immediately with a descriptive error message.

### Frontend (optional for now)

```bash
cp .env.example apps/frontend/.env
# Edit VITE_API_BASE_URL if your backend runs on a different port
```

---

## MongoDB (Local Development)

You have MongoDB **v6.0.3** installed natively on Windows.

### Check if the service is running

```powershell
Get-Service -Name MongoDB
```

### Start the service (if stopped)

```powershell
# Option A — Windows service (if installed as a service)
Start-Service -Name MongoDB

# Option B — Manual start (adjust the data path as needed)
mongod --dbpath "C:\data\db"
```

### Verify the connection

```powershell
mongosh mongodb://localhost:27017/atlas_dev --eval "db.runCommand({ping:1})"
```

A successful response looks like: `{ ok: 1 }`

### Database names

| Environment | Database |
|---|---|
| Development | `atlas_dev` |
| Test | `atlas_test` (used by Vitest; isolated from dev data) |
| Production | Configured via `MONGODB_URI` in deployment secrets |

> **No destructive operations** are run at application startup. Mongoose `autoIndex` is disabled in production.

---

## Running the Application

### Backend

```bash
# Development (hot-reload with tsx)
npm run dev:backend

# Or from the backend workspace directly
npm -w apps/backend run dev
```

The server starts at **http://localhost:5000** (or `PORT` from your `.env`).

### Frontend

```bash
# Development (Vite HMR)
npm run dev:frontend

# Or from the frontend workspace directly
npm -w apps/frontend run dev
```

The app opens at **http://localhost:5173**.

### Running both concurrently

Open two terminals and run `dev:backend` and `dev:frontend` in each. (A `concurrently` script will be added in a later phase.)

---

## Running Tests

Tests run **without a real MongoDB connection** — the health route has no DB dependency, and the test vitest config injects a test MONGODB_URI automatically.

```bash
# Run all tests (backend + frontend)
npm test

# Backend only
npm run test:backend
# or
npm -w apps/backend run test

# Frontend only
npm run test:frontend
# or
npm -w apps/frontend run test

# Watch mode (backend)
npm -w apps/backend run test:watch

# Coverage report
npm -w apps/backend run test:coverage
```

---

## API Reference

### `GET /api/v1/health`

Liveness probe — returns 200 when the Express process is alive.

**Response** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-10-25T17:30:00.000Z",
  "environment": "development",
  "version": "0.1.0"
}
```

**Error responses**

| Status | Meaning |
|---|---|
| `404` | Route not registered |
| `500` | Unhandled internal error (message is sanitized) |

---

## Code Quality

```bash
# TypeScript type-checking (all workspaces)
npm run typecheck

# ESLint
npm run lint

# Prettier — format all files
npm run format

# Prettier — check without writing (for CI)
npm run format:check
```

---

## Troubleshooting

### `Error: MONGODB_URI is required`

The backend `.env` file is missing or not populated.

```bash
cp apps/backend/.env.example apps/backend/.env
# Then edit apps/backend/.env and set MONGODB_URI
```

### `MongoServerSelectionError: connect ECONNREFUSED`

MongoDB is not running. Start it:

```powershell
Start-Service -Name MongoDB
# or
mongod --dbpath "C:\data\db"
```

### `EADDRINUSE: address already in use :::5000`

Another process is using port 5000. Change `PORT` in `apps/backend/.env`, or kill the process:

```powershell
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

### `Cannot find module '@atlas/shared'`

Run `npm install` from the **repository root** (not inside an app subdirectory). The workspace symlink is only created from the root.

```bash
# From e:\Library_project\
npm install
```

### TypeScript errors in `@atlas/shared` imports

The `paths` mapping in `apps/backend/tsconfig.json` resolves `@atlas/shared` → `packages/shared/src/index.ts`. If your IDE doesn't pick it up, restart the TypeScript language server.

---

## Development Notes

- **Money is stored as integer paise** (1 INR = 100 paise) throughout the application. No floating-point financial arithmetic.
- **Tenant isolation** is enforced server-side on every API operation. Never trust a `tenantId` from the browser as authorization proof.
- **Business rules** (fees, seat limits, shift hours) are configurable per tenant — never hardcoded.
- **Secrets** (`JWT_SECRET`, DB passwords, API keys) must never be committed. Add to `.env` and keep it gitignored.
