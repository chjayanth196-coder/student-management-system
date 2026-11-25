# TODO

## Phase 4 — Staff & Teacher Management (Approved)

### Backend
- [x] Create `server/models/Staff.js`

- [x] Create `server/middleware/staffTenantScope.js`



- [ ] Create `server/controllers/staffController.js`
- [ ] Create `server/controllers/staffAssignmentController.js`
- [x] Create `server/routes/staffRoutes.js`

- [ ] Mount Staff routes in `server/server.js`

### Frontend
- [ ] Add Staff navigation links in `client/src/pages/admin/institutions/InstitutionDashboard.js`
- [ ] Add routes in `client/src/App.js`
- [ ] Create Staff pages under `client/src/pages/admin/institutions/staff/`

### Integration & Validation
- [ ] Implement employeeId generation per institution (immutable)
- [ ] Implement soft-delete support (status inactive + deletedAt/deletedBy)
- [ ] Implement create/update validations (email/phone/joining date/section-class-subject-class relationships)
- [ ] Implement reset password (never return password)
- [ ] Implement classTeacher rule: only one teacher per section
- [ ] Ensure tenant isolation for Institution Admin + explicit institutionId for Super Admin

### Verification
- [ ] Run backend syntax checks
- [ ] Run frontend production build
- [ ] Fix Phase-4 related build/runtime issues

(Stop here after Phase 4 is complete.)

