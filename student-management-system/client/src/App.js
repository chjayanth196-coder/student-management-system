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

