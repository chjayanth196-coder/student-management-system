# Multi-College ERP Platform - Deployment Guide

## Prerequisites

- Node.js 20.x
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16 (or Docker)
- Redis 7 (or Docker)
- Git

## Quick Start (Development)

### 1. Clone and Setup

```bash
# Clone repository
git clone <repo-url>
cd erp-platform

# Backend setup
cd backend
cp ../.env.development .env
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Health Check: http://localhost:4000/health

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | superadmin@erp.com | SuperAdmin@123 |
| College Admin | admin@demouniversity.edu | CollegeAdmin@123 |
| Student | alice.johnson@demouniversity.edu | Student@123 |
| Faculty | john.doe@demouniversity.edu | Faculty@123 |

## Docker Deployment

### Build and Run

```bash
# From erp-platform directory
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### Stop

```bash
docker compose down
# To remove volumes (WARNING: deletes data)
docker compose down -v
```

## Production Deployment

### Prerequisites

- Domain name with SSL certificate
- PostgreSQL 16 (managed or self-hosted)
- Redis 7 (managed or self-hosted)
- Docker & Docker Compose or Kubernetes cluster
- Reverse proxy (Nginx/Caddy/Traefik)

### Steps

1. **Configure environment**

```bash
cp .env.production .env
# Edit .env with production values
# Generate strong JWT_SECRET: openssl rand -base64 64
```

2. **Set up SSL certificates**

```bash
# Using Let's Encrypt with Certbot
docker run --rm -p 80:80 -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d erp.example.com
```

3. **Deploy with Docker Compose**

```bash
docker compose -f docker-compose.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/

# Check status
kubectl get all -n erp-platform
kubectl get pods -n erp-platform -w
```

## Database Migrations

```bash
# Development
npx prisma migrate dev --name migration_name

# Production
npx prisma migrate deploy
```

## Backup & Restore

### Database Backup

```bash
# Docker
docker exec -t erp-postgres pg_dump -U erp_user erp_platform > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker exec -i erp-postgres psql -U erp_user erp_platform
```

### Redis Backup

Redis data is persisted to `/data` volume with AOF enabled.

## Monitoring

- Health endpoint: `GET /health`
- Readiness probe: `GET /health/readiness`
- Liveness probe: `GET /health/liveness`
- Metrics: `GET /metrics`

## Logging

Logs are output to stdout/stderr (Docker friendly).
For production, configure log aggregation (ELK, Datadog, etc.)
