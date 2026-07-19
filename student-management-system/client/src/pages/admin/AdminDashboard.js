import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/students");
      setStudents(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage students, attendance, and results.</p>

      <div className="stat-grid stat-grid-3">
        <div className="stat-card">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Quick Action</span>
          <Link to="/admin/students" className="btn btn-primary btn-small">Manage Students</Link>
        </div>
        <div className="stat-card">
          <span className="stat-label">Quick Action</span>
          <Link to="/admin/attendance" className="btn btn-primary btn-small">Mark Attendance</Link>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recently Added Students</h2>
        {students.length === 0 ? (
          <p className="empty-state">No students yet. Add your first student to get started.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Roll No.</th><th>Class</th><th>Email</th></tr></thead>
            <tbody>
              {students.slice(0, 6).map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.rollNo || "—"}</td>
                  <td>{s.class || "—"}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
