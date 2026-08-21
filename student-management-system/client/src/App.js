import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/react";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentAttendance = lazy(() => import("./pages/student/StudentAttendance"));
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageStudents = lazy(() => import("./pages/admin/ManageStudents"));
const ManageAttendance = lazy(() => import("./pages/admin/ManageAttendance"));
const ManageResults = lazy(() => import("./pages/admin/ManageResults"));
const RegisterInstitute = lazy(() => import("./pages/RegisterInstitute"));
const InstitutionsList = lazy(() => import("./pages/admin/institutions/InstitutionsList"));
const CreateInstitution = lazy(() => import("./pages/admin/institutions/CreateInstitution"));
const EditInstitution = lazy(() => import("./pages/admin/institutions/EditInstitution"));
const InstitutionDetails = lazy(() => import("./pages/admin/institutions/InstitutionDetails"));
const InstitutionDashboard = lazy(() => import("./pages/admin/institutions/InstitutionDashboard"));
const ManageStaff = lazy(() => import("./pages/admin/institutions/staff/ManageStaff"));
const AcademicYearsList = lazy(() => import("./pages/admin/institutions/academic/AcademicYearsList"));
const AcademicYearCreate = lazy(() => import("./pages/admin/institutions/academic/AcademicYearCreate"));
const AcademicYearEdit = lazy(() => import("./pages/admin/institutions/academic/AcademicYearEdit"));
const DepartmentList = lazy(() => import("./pages/admin/institutions/academic/DepartmentList"));
const DepartmentCreate = lazy(() => import("./pages/admin/institutions/academic/DepartmentCreate"));
const DepartmentEdit = lazy(() => import("./pages/admin/institutions/academic/DepartmentEdit"));
const ClassList = lazy(() => import("./pages/admin/institutions/academic/ClassList"));
const ClassCreate = lazy(() => import("./pages/admin/institutions/academic/ClassCreate"));
const ClassEdit = lazy(() => import("./pages/admin/institutions/academic/ClassEdit"));
const SectionList = lazy(() => import("./pages/admin/institutions/academic/SectionList"));
const SectionCreate = lazy(() => import("./pages/admin/institutions/academic/SectionCreate"));
const SectionEdit = lazy(() => import("./pages/admin/institutions/academic/SectionEdit"));
const SubjectList = lazy(() => import("./pages/admin/institutions/academic/SubjectList"));
const SubjectCreate = lazy(() => import("./pages/admin/institutions/academic/SubjectCreate"));
const SubjectEdit = lazy(() => import("./pages/admin/institutions/academic/SubjectEdit"));

const LoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
    <p>Loading...</p>
  </div>
);

function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              user
                ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />
                : <Login />
            }
          />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute role="student"><StudentResults /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><ManageAttendance /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute role="admin"><ManageResults /></ProtectedRoute>} />
          <Route path="/admin/register-institute" element={<ProtectedRoute role="admin"><RegisterInstitute /></ProtectedRoute>} />

          {/* Institution Management (Super Admin) */}
          <Route path="/admin/institutions" element={<ProtectedRoute role="admin"><InstitutionsList /></ProtectedRoute>} />
          <Route path="/admin/institutions/new" element={<ProtectedRoute role="admin"><CreateInstitution /></ProtectedRoute>} />
          <Route path="/admin/institutions/:id" element={<ProtectedRoute role="admin"><InstitutionDashboard /></ProtectedRoute>} />
          <Route path="/admin/institutions/:id/edit" element={<ProtectedRoute role="admin"><EditInstitution /></ProtectedRoute>} />
          <Route path="/admin/institutions/:id/details" element={<ProtectedRoute role="admin"><InstitutionDetails /></ProtectedRoute>} />
          <Route path="/admin/institutions/:id/staff" element={<ProtectedRoute role="admin"><ManageStaff /></ProtectedRoute>} />

          {/* Institution Academic Structure (Phase 3) */}
          <Route
            path="/admin/institutions/:id/academic-years"
            element={<ProtectedRoute role="admin"><AcademicYearsList /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/academic-years/new"
            element={<ProtectedRoute role="admin"><AcademicYearCreate /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/academic-years/:yearId/edit"
            element={<ProtectedRoute role="admin"><AcademicYearEdit /></ProtectedRoute>}
          />

          <Route
            path="/admin/institutions/:id/departments"
            element={<ProtectedRoute role="admin"><DepartmentList /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/departments/new"
            element={<ProtectedRoute role="admin"><DepartmentCreate /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/departments/:departmentId/edit"
            element={<ProtectedRoute role="admin"><DepartmentEdit /></ProtectedRoute>}
          />

          <Route
            path="/admin/institutions/:id/classes"
            element={<ProtectedRoute role="admin"><ClassList /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/classes/new"
            element={<ProtectedRoute role="admin"><ClassCreate /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/classes/:classId/edit"
            element={<ProtectedRoute role="admin"><ClassEdit /></ProtectedRoute>}
          />

          <Route
            path="/admin/institutions/:id/sections"
            element={<ProtectedRoute role="admin"><SectionList /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/sections/new"
            element={<ProtectedRoute role="admin"><SectionCreate /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/sections/:sectionId/edit"
            element={<ProtectedRoute role="admin"><SectionEdit /></ProtectedRoute>}
          />

          <Route
            path="/admin/institutions/:id/subjects"
            element={<ProtectedRoute role="admin"><SubjectList /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/subjects/new"
            element={<ProtectedRoute role="admin"><SubjectCreate /></ProtectedRoute>}
          />
          <Route
            path="/admin/institutions/:id/subjects/:subjectId/edit"
            element={<ProtectedRoute role="admin"><SubjectEdit /></ProtectedRoute>}
          />

          <Route
            path="*"
            element={
              <Navigate to={user ? (user.role === "admin" ? "/admin/dashboard" : "/student/dashboard") : "/login"} replace />
            }
          />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </>
  );
}

export default App;
