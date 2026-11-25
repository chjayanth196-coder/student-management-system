# ERP Platform (Student Management System)

This repository contains two projects:

- **`erp-platform/`** — current multi-college ERP (NestJS backend + Next.js frontend). This is the actively developed app.
- **`erp-platform/legacy/student-management-system/`** — earlier MERN prototype (kept for reference).

## Quick Start (ERP Platform)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7 (optional in dev)

### Backend
```bash
cd erp-platform/backend
cp .env.development .env   # adjust DATABASE_URL if needed
npm install
npx prisma generate
npx prisma db push
npm run start:dev          # http://localhost:4000, docs at /api/v1/docs
```

### Frontend
```bash
cd erp-platform/frontend
npm install
npm run dev                # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` in `erp-platform/frontend/.env.local`.

## Docker
From `erp-platform/`:
```bash
docker compose up -d --build
```

## Deployable Package
`erp-platform-deployable.zip` contains the source (excluding regeneratable `node_modules`, `.git`, `.next`, `dist`, `coverage`). Extract, run `npm install` in `erp-platform/backend` and `erp-platform/frontend`, configure env vars, build, and run.

## Completed Modules
- Auth/JWT/RBAC, multi-tenant institutions
- Super Admin analytics + college credentials manager
- Academic structure (years, departments, classes, sections, subjects)
- Students & Staff CRUD
- Attendance marking, reports, student view
- Results marks entry, class results, student report
- Exam planning/scheduling
- Fees, Library, Hostel, Transport, Placement
- Notifications, Settings, AI assistant, Dashboard

