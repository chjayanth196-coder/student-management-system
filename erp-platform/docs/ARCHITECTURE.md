# Multi-College ERP Platform - Architecture

## Overview

The platform follows a **modular monolith** architecture with clear separation of concerns, designed to evolve into a microservices architecture as the platform grows.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (Next.js 14 + Tailwind)                   │
├─────────────────────────────────────────────────────────────┤
│                      Nginx Reverse Proxy                     │
├─────────────────────────────────────────────────────────────┤
│                      Backend (NestJS)                        │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Auth    │ │Academic │ │Students  │ │    Staff        │   │
│  │ Module  │ │Module   │ │Module    │ │    Module       │   │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├────────────────┤   │
│  │Attendance│ │Results  │ │Fees      │ │Notifications   │   │
│  │ Module   │ │Module   │ │Module    │ │ Module         │   │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├────────────────┤   │
│  │Instit-  │ │Users    │ │Dashboard  │ │   Future       │   │
│  │utions   │ │Module   │ │Module    │ │   Modules      │   │
│  └─────────┘ └─────────┘ └──────────┘ └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Common Services                        │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Prisma  │ │ Redis   │ │Logger    │ │Monitoring      │   │
│  │ ORM     │ │ Cache   │ │Service   │ │Controller      │   │
│  ├─────────┤ ├─────────┤ ├──────────┤ ├────────────────┤   │
│  │JWT Auth │ │ RBAC   │ │Tenant   │ │Audit Log       │   │
│  │Guard    │ │Guard   │ │Guard    │ │Service         │   │
│  └─────────┘ └─────────┘ └──────────┘ └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │              PostgreSQL (Prisma ORM)               │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Redis (Cache/Sessions)                │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Modular Monolith
- All modules live in a single NestJS application
- Each module is independently developed and tested
- Future: extract high-load modules into separate microservices

### 2. Multi-Tenancy
- Row-level tenant isolation using institutionId
- TenantGuard ensures cross-tenant data access is blocked
- SuperAdmin has cross-tenant access
- Each module uses institutionId from route params

### 3. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC) with 16 user roles
- Public endpoints marked with @Public() decorator
- Role hierarchy: SuperAdmin > CollegeAdmin > Principal > HOD > Faculty > Student

### 4. API Design
- RESTful, versioned (/api/v1)
- Consistent response format (TransformInterceptor)
- Pagination for list endpoints
- Search/filter/sort support
- Swagger/OpenAPI documentation (future)

### 5. Database Design
- PostgreSQL with Prisma ORM
- 20+ models covering all ERP domains
- Composite unique indexes prevent duplicates
- Soft deletes for data safety
- Audit fields (createdAt, updatedAt)
- Future-proof relationships

### 6. Frontend Architecture
- Next.js 14 App Router
- Server components by default, client components where needed
- Shadcn/UI component library
- React Query for server state management
- React Hook Form + Zod for form validation
- Role-based UI rendering
- Dark/light mode support

## Scalability Strategy

### Horizontal Scaling
- Stateless backend (all state in Redis/DB)
- Load balancer distributes requests
- Database read replicas for reporting
- Redis cluster for distributed caching

### Performance Optimizations
- Database indexes on frequently queried columns
- Pagination for list endpoints
- Response compression (gzip)
- Rate limiting (ThrottlerModule)
- Connection pooling (Prisma)
- Caching layer (Redis)

## Security

- Helmet security headers
- CORS configuration
- Rate limiting (60 req/min per IP)
- JWT token expiration (15min access, 7d refresh)
- Password hashing (bcrypt, 12 rounds)
- Input validation (class-validator)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection
- CSRF protection via tokens

## Future Extensibility

The architecture supports adding new modules without modifying existing code:

1. Create new module directory
2. Define Prisma models (if needed)
3. Create service, controller, DTOs
4. Register module in AppModule
5. Add frontend pages in /app/{module}
6. Add navigation items with role permissions
