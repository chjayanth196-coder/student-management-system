# Multi-College ERP Platform - API Documentation

## Overview

Base URL: `/api/v1`

Authentication: Bearer JWT token

## Authentication

### POST /auth/login
Login with email and password.

```json
{
  "email": "superadmin@erp.com",
  "password": "SuperAdmin@123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",
    "refreshToken": "...",
    "expiresIn": "15m"
  }
}
```

### POST /auth/register
Register a new user. (Public endpoint)

### POST /auth/refresh
Refresh access token.

### POST /auth/logout
Logout and invalidate refresh token. (Authenticated)

### GET /auth/profile
Get current user profile. (Authenticated)

## Institutions

### GET /institutions
List all institutions. (Authenticated)

Query params: `q` (search), `type`, `status`

### GET /institutions/:id
Get institution details with counts.

### POST /institutions
Create institution. (SuperAdmin only)

### PUT /institutions/:id
Update institution. (SuperAdmin, CollegeAdmin)

### DELETE /institutions/:id
Deactivate institution. (SuperAdmin)

## Academic Structure

All endpoints require `:institutionId` param.

### ACADEMIC YEARS
- `GET /institutions/:id/academic-years` - List years
- `POST /institutions/:id/academic-years` - Create year
- `PUT /institutions/:id/academic-years/:yearId` - Update year

### DEPARTMENTS
- `GET /institutions/:id/departments?academicYearId=` - List depts
- `POST /institutions/:id/departments?academicYearId=` - Create dept
- `GET /institutions/:id/departments/:deptId` - Get dept
- `PUT /institutions/:id/departments/:deptId` - Update dept
- `DELETE /institutions/:id/departments/:deptId` - Deactivate dept

### CLASSES
- `GET /institutions/:id/classes` - List classes
- `POST /institutions/:id/classes?academicYearId=&departmentId=` - Create class
- `PUT /institutions/:id/classes/:classId` - Update class
- `DELETE /institutions/:id/classes/:classId` - Deactivate class

### SECTIONS
- `GET /institutions/:id/sections?classId=` - List sections
- `POST /institutions/:id/sections?classId=` - Create section
- `PUT /institutions/:id/sections/:sectionId` - Update section
- `DELETE /institutions/:id/sections/:sectionId` - Deactivate section

### SUBJECTS
- `GET /institutions/:id/subjects` - List subjects
- `POST /institutions/:id/subjects?academicYearId=&departmentId=&classId=` - Create subject
- `PUT /institutions/:id/subjects/:subjectId` - Update subject
- `DELETE /institutions/:id/subjects/:subjectId` - Deactivate subject

## Students

All endpoints under `:institutionId`.

### GET /students
List students with pagination.

Query params: `search`, `page` (default: 1), `limit` (default: 20)

### POST /students
Create student.

### GET /students/:id
Get student details.

### PUT /students/:id
Update student.

### DELETE /students/:id
Deactivate student.

## Staff

All endpoints under `:institutionId`.

### GET /staff
List staff with filters.

Query params: `search`, `staffType`, `status`, `departmentId`, `page`, `limit`

### POST /staff
Create staff member. Creates associated user account.

### GET /staff/:id
Get staff details.

### PUT /staff/:id
Update staff.

### DELETE /staff/:id
Deactivate staff.

### PATCH /staff/:id/toggle
Toggle staff active/inactive status.

### POST /staff/:id/reset-password
Reset staff password.

## Attendance

All endpoints under `:institutionId`.

### POST /attendance/daily?sectionId=&subjectId=
Mark individual attendance.

### POST /attendance/daily/bulk?sectionId=&subjectId=
Mark bulk attendance.

### GET /attendance/student/:studentId
Get student attendance records.

Query params: `startDate`, `endDate` (ISO date format)

### GET /attendance/me
Get current user's attendance with summary.

### PUT /attendance/:id
Update attendance record status.

### DELETE /attendance/:id
Delete attendance record.

## Users

### GET /users
List all users. (Filterable by institutionId)

### GET /users/me
Get current user profile.

### GET /users/:id
Get user details.

### POST /users
Create user. (SuperAdmin, CollegeAdmin)

### PUT /users/:id
Update user.

### DELETE /users/:id
Deactivate user.

## Health & Monitoring

### GET /health
Health check endpoint. Returns database status, memory usage, uptime.

### GET /health/readiness
Kubernetes readiness probe.

### GET /health/liveness
Kubernetes liveness probe.

### GET /metrics
Application metrics.

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Pagination

List endpoints return:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
