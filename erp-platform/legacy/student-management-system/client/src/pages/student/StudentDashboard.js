import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [resultSummary, setResultSummary] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [attRes, resRes] = await Promise.all([
          api.get("/attendance/me"),
          api.get("/results/me"),
        ]);
        setAttendanceSummary(attRes.data.summary);
        setResultSummary(resRes.data.summary);
        setRecentResults(resRes.data.results.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-container"><p>Loading your report...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Welcome back, {user.name.split(" ")[0]}</h1>
      <p className="page-subtitle">Here's a snapshot of your academic report.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Attendance</span>
          <span className="stat-value">{attendanceSummary?.percentage ?? 0}%</span>
          <span className="stat-hint">{attendanceSummary?.present ?? 0} present / {attendanceSummary?.total ?? 0} days</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Overall Score</span>
          <span className="stat-value">{resultSummary?.overallPercentage ?? 0}%</span>
          <span className="stat-hint">{resultSummary?.totalObtained ?? 0} / {resultSummary?.totalMax ?? 0} marks</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Absences</span>
          <span className="stat-value">{attendanceSummary?.absent ?? 0}</span>
          <span className="stat-hint">days marked absent</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Roll No.</span>
          <span className="stat-value">{user.rollNo || "—"}</span>
          <span className="stat-hint">{user.class ? `Class ${user.class}` : "No class assigned"}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Results</h2>
        {recentResults.length === 0 ? (
          <p className="empty-state">No results have been added yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Subject</th><th>Term</th><th>Marks</th><th>Grade</th></tr>
            </thead>
            <tbody>
              {recentResults.map((r) => (
                <tr key={r._id}>
                  <td>{r.subject}</td>
                  <td>{r.term} ({r.year})</td>
                  <td>{r.marksObtained}/{r.maxMarks}</td>
                  <td><span className="grade-pill">{r.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
