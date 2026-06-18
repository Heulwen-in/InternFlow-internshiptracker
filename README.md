# InternFlow — Internship & Job Tracker

A full-stack application for students and graduates to track internship and job applications — from first save through interviews, tasks, and offers.

## Features

### Authentication
- User registration and login with JWT
- Email verification via 6-digit OTP (with resend countdown)
- Forgot-password flow with email reset links
- Password strength validation and show/hide password toggles
- Protected API routes and React routes

### Application management
- Company CRUD with find-or-create when adding applications
- Application CRUD (role, status, priority, work type, deadlines, and more)
- Application detail drawer (notes, interviews, tasks, status history)
- Modal-based create/edit form (URL-addressable via search params)
- Search, filters, and table/card view toggle on the applications page
- Kanban board with drag-and-drop status updates
- Status history tracking on every status change

### Productivity
- Dashboard with stat strip, “What’s Next” agenda, and pipeline overview
- Task management grouped by Overdue, Today, Upcoming, and Done
- Calendar month view for deadlines, interviews, and task due dates
- Per-application notes and interview scheduling

### UI / UX
- Editorial design system (Newsreader, Schibsted Grotesk, Spline Sans Mono)
- Light and dark themes with persisted preference
- Responsive layout with shared components (badges, empty states, filters)
- Landing page and focused auth-flow screens (verify email, reset password)

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express 5, JWT, bcrypt |
| Database | PostgreSQL, Prisma ORM |
| Email | Nodemailer (OTP + password reset) |
| DevOps | Docker Compose (PostgreSQL), GitHub Actions CI |

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### 1. Database

```bash
# From the repo root — starts PostgreSQL on port 5432
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in JWT_SECRET and SMTP settings
npm install
npx prisma migrate dev
npm run dev              # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

### Environment variables

**Root** (`.env`) — used by Docker Compose:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`

**Backend** (`backend/.env`):
- `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, `APP_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

**Frontend** (`frontend/.env`):
- `VITE_API_URL` (default `http://localhost:5000`)

## Frontend Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Sign in and create account |
| `/verify-email` | 6-digit OTP verification after registration |
| `/forgot-password` | Request a password reset link |
| `/reset-password` | Set a new password (from email `?token=…`) |
| `/dashboard` | Overview stats and pipeline |
| `/applications` | Searchable list (table or cards) |
| `/applications/kanban` | Drag-and-drop board by status |
| `/calendar` | Month view of deadlines and events |
| `/tasks` | Standalone and linked tasks |

## API Overview

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account, send verification OTP |
| POST | `/auth/login` | Sign in (requires verified email) |
| POST | `/auth/verify-email` | Verify OTP, returns JWT |
| POST | `/auth/resend-verification` | Resend verification code |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/validate-reset-token` | Check reset link validity |
| POST | `/auth/reset-password` | Set new password |
| GET | `/auth/me` | Current user (JWT required) |

### Companies

| Method | Endpoint |
|---|---|
| GET, POST | `/companies` |
| GET, PUT, DELETE | `/companies/:id` |

### Applications

| Method | Endpoint |
|---|---|
| GET, POST | `/applications` |
| GET, PUT, DELETE | `/applications/:id` |

### Notes, tasks, interviews

| Method | Endpoint |
|---|---|
| GET, POST | `/applications/:applicationId/notes` |
| DELETE | `/notes/:id` |
| GET, POST | `/tasks` |
| PUT, DELETE | `/tasks/:id` |
| GET | `/interviews` |
| GET, POST | `/applications/:applicationId/interviews` |
| DELETE | `/interviews/:id` |

### Health

| Method | Endpoint |
|---|---|
| GET | `/health` |

## Project Structure

```
├── backend/          # Express API, Prisma schema, auth service, mailer
├── frontend/         # React app (pages, components, contexts, API clients)
├── docs/             # Design handoff and auth-flow specifications
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## CI

GitHub Actions runs on push/PR to `main`:
- **Backend** — `npx prisma validate` + Node syntax check
- **Frontend** — `npm run lint` + `npm run build`

## Verification

```bash
cd frontend
npm run lint
npm run build

cd backend
npx prisma validate
```