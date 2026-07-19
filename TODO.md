# TODO — Student Management System (Multi-school + Attendance UX)

## Phase 1: Multi-school / institute scoping
- [ ] Create `server/models/Institute.js`
- [ ] Update `server/models/User.js` to add `institute` ref
- [ ] Update `server/models/User.js` to add missing `section` field
- [ ] Update `server/controllers/authController.js` login to require institute scope
- [ ] Update attendance models/controllers/routes to store/filter by institute

## Phase 2: Login UI (School/College ID)
- [ ] Update `client/src/pages/Login.js` to add `instituteCode` input
- [ ] (Optional) Add dropdown mode for `instituteId` later

## Phase 3: Attendance UI/Backend redesign
- [ ] Add new backend endpoint to mark attendance for selected class+section with per-student status
- [ ] Update `client/src/pages/admin/ManageAttendance.js` to:
  - [ ] Add Class → Section → Subject → Date selectors
  - [ ] Fetch and display students for that class+section
  - [ ] Mark Present/Absent/Late per student
  - [ ] Submit to new endpoint
- [ ] Ensure old `/attendance/bulk` is removed or disabled in UI

## Phase 4: “Recruitment / Events” (new feature)
- [ ] Define models & endpoints:
  - [ ] `RecruitmentEvent` / `Company`
  - [ ] `EventRegistration` for students/teachers
- [ ] Build UI pages for:
  - [ ] Admin/Company to add events
  - [ ] Students to view & register/attend

## Validation
- [ ] Backend runs reliably on port 5000
- [ ] Frontend builds and runs, attendance works per class/section
- [ ] Students/admins can’t see other institutes’ data

