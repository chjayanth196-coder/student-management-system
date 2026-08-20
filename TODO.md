# ERP Platform - Super Admin Analytics & College Credentials Manager

## Goal
Give the Super Admin:
1. A comprehensive **Analytics dashboard** — institution growth, placement packages (highest/avg), yearly income for every institution.
2. A **College Credentials Manager** — one button to view every college's admin ID + password, protected by re-entering the Super Admin's own password, and only Super Admin can reset/change passwords.

## Steps

### Backend
- [x] 1. Add `plainPassword String?` to `User` model in Prisma schema
- [x] 2. Update `InstitutionsService.create()` to store the admin's plaintext password
- [x] 3. Create `analytics` module (controller + service)
      - `GET /superadmin/analytics` — platform overview + institution ranking
      - `GET /superadmin/analytics/:institutionId` — per-institution deep analytics
      - `GET /superadmin/analytics/comparison` — side-by-side comparison
- [x] 4. Create `superadmin` module for credentials manager
      - `GET /superadmin/colleges/credentials` — list colleges + admin email/password (SuperAdmin only)
      - `POST /superadmin/colleges/verify-password` — re-verify Super Admin password
      - `PUT /superadmin/colleges/:institutionId/admin-password` — reset admin password
- [x] 5. Register new modules in `app.module.ts`
- [x] 6. Sync DB schema via `prisma db push` (added `plainPassword` column; avoided migrate dev due to schema drift/data-loss risk)
- [x] 6b. Regenerate Prisma client (stopped backend lock, ran `npx prisma generate` — success)
- [x] 6c. Backend compiles cleanly (`tsc --noEmit` exit code 0)

### Frontend
- [x] 7. Create `/superadmin/analytics` page — growth ranking, highest/avg package, yearly income
- [x] 8. Create `/superadmin/colleges` page — credentials manager button (password-protected reveal + reset)
- [x] 9. Add navigation links (Sidebar) for Super Admin (Analytics + College Credentials)
- [x] 10. Frontend compiles cleanly (`tsc --noEmit` exit code 0)

## Status
- [x] Task analyzed & plan approved
- [x] Backend code complete & registered
- [x] DB schema synced via `prisma db push`
- [x] Prisma client regenerated (locked DLL resolved by stopping backend process)
- [x] Frontend pages + sidebar nav complete
- [x] Backend `tsc --noEmit` passes
- [x] Frontend `tsc --noEmit` passes
- [x] Backend restarted & healthy (`/health` returns ok)
- [x] New endpoints verified live — `/api/v1/superadmin/analytics` and `/api/v1/superadmin/colleges/credentials` return 401 (auth-protected, routes registered)

## ✅ DONE

---
## Bonus: Institution Self-Management Separation
Also implemented the requested separation where **only the Super Admin registers each institution** (with admin login + password) and the **institution admin self-manages their own institution profile**:
- [x] `POST /institutions` (SuperAdmin only) now auto-creates a `CollegeAdmin` account with the provided admin email/password (stored as `plainPassword` so Super Admin can view/reset later).
- [x] `GET /institutions` scoped — non-super-admins only see their own institution.
- [x] `GET/PUT /institutions/:id` scoped — non-super-admins can only view/edit their own institution; CollegeAdmin cannot change name/type/slug or deactivate.
- [x] New `/institution/my` page lets the institution admin view & update their own institution's profile (address, city, contact, principal, etc.).
- [x] Sidebar now shows "My Institution" for `CollegeAdmin` role.
- [x] Super Admin "Register Institution" form simplified to only name/type + admin credentials (details filled later by the admin).
