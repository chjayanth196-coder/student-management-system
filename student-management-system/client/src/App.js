import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageAttendance from "./pages/admin/ManageAttendance";
import ManageResults from "./pages/admin/ManageResults";
import RegisterInstitute from "./pages/RegisterInstitute";
import InstitutionsList from "./pages/admin/institutions/InstitutionsList";
import CreateInstitution from "./pages/admin/institutions/CreateInstitution";
import EditInstitution from "./pages/admin/institutions/EditInstitution";
import InstitutionDetails from "./pages/admin/institutions/InstitutionDetails";
import InstitutionDashboard from "./pages/admin/institutions/InstitutionDashboard";
import ManageStaff from "./pages/admin/institutions/staff/ManageStaff";

import AcademicYearsList from "./pages/admin/institutions/academic/AcademicYearsList";

import AcademicYearCreate from "./pages/admin/institutions/academic/AcademicYearCreate";
import AcademicYearEdit from "./pages/admin/institutions/academic/AcademicYearEdit";

import DepartmentList from "./pages/admin/institutions/academic/DepartmentList";
import DepartmentCreate from "./pages/admin/institutions/academic/DepartmentCreate";
import DepartmentEdit from "./pages/admin/institutions/academic/DepartmentEdit";

import ClassList from "./pages/admin/institutions/academic/ClassList";
import ClassCreate from "./pages/admin/institutions/academic/ClassCreate";
import ClassEdit from "./pages/admin/institutions/academic/ClassEdit";

import SectionList from "./pages/admin/institutions/academic/SectionList";
import SectionCreate from "./pages/admin/institutions/academic/SectionCreate";
import SectionEdit from "./pages/admin/institutions/academic/SectionEdit";

import SubjectList from "./pages/admin/institutions/academic/SubjectList";
import SubjectCreate from "./pages/admin/institutions/academic/SubjectCreate";
import SubjectEdit from "./pages/admin/institutions/academic/SubjectEdit";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
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
    </>
  );
}

export default App;

