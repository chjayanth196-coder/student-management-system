import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const base = user.role === "admin" ? "/admin" : "/student";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🎓</span>
        <span>Student Management System</span>
      </div>

        <div className="navbar-links">
        {user.role === "student" ? (
          <>
            <Link to={`${base}/dashboard`}>Dashboard</Link>
            <Link to={`${base}/attendance`}>Attendance</Link>
            <Link to={`${base}/results`}>Results</Link>
            <Link to={`${base}/profile`}>Profile</Link>
          </>
        ) : (
          <>
            <Link to={`${base}/dashboard`}>Dashboard</Link>
            {user.superAdmin ? (
              <Link to="/admin/institutions">Institutions</Link>
            ) : null}
            <Link to={`${base}/students`}>Students</Link>
            <Link to={`${base}/attendance`}>Attendance</Link>
            <Link to={`${base}/results`}>Results</Link>
          </>
        )}
      </div>


      <div className="navbar-user">
        <span className="navbar-username">{user.name}</span>
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
