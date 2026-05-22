# InternFlow - Internship Tracker

A full-stack internship and job application management system for students and graduates.

## Tech Stack

- React + Vite
- Node.js + Express
- PostgreSQL
- Prisma
- JWT Authentication
- Docker
- GitHub Actions

## Current Features

- User registration and login
- JWT-protected backend routes
- Protected React routes
- Company CRUD
- Application CRUD
- User-specific application data
- Application creation flow
- Dashboard metrics
- Dockerized PostgreSQL
- Prisma schema and migrations

## API Overview

### Auth

POST /api/auth/register  
POST /api/auth/login  
GET /api/auth/me  

### Companies

GET /api/companies  
POST /api/companies  
GET /api/companies/:id  
PUT /api/companies/:id  
DELETE /api/companies/:id  

### Applications

GET /api/applications  
POST /api/applications  
GET /api/applications/:id  
PUT /api/applications/:id  
DELETE /api/applications/:id  

## Project Status

- Week 1: Project setup, Docker PostgreSQL, Prisma, README, ERD.
- Week 2: JWT authentication, protected routes, login/register UI.
- Week 3: MVP foundation with company and application CRUD.
- Week 4: Search, filters, sorting, status updates, edit flow, and dashboard improvements.

## Verification

```bash
cd frontend
npm run lint
npm run build

cd backend
npx prisma validate
```