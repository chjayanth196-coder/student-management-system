import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const statusClass = { Present: "badge-success", Absent: "badge-danger", Late: "badge-warning" };

const StudentAttendance = () => {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/attendance/me");
      setSummary(data.summary);
      setRecords(data.records);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="page-container"><p>Loading attendance...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">My Attendance</h1>
      <p className="page-subtitle">Your full attendance record, synced from the school's system.</p>

      <div className="stat-grid stat-grid-4">
        <div className="stat-card"><span className="stat-label">Overall %</span><span className="stat-value">{summary.percentage}%</span></div>
        <div className="stat-card"><span className="stat-label">Present</span><span className="stat-value">{summary.present}</span></div>
        <div className="stat-card"><span className="stat-label">Absent</span><span className="stat-value">{summary.absent}</span></div>
        <div className="stat-card"><span className="stat-label">Late</span><span className="stat-value">{summary.late}</span></div>
      </div>

      <div className="card">
        <h2 className="card-title">Attendance Log</h2>
        {records.length === 0 ? (
          <p className="empty-state">No attendance has been recorded yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Subject</th><th>Status</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.subject}</td>
                  <td><span className={`badge ${statusClass[r.status]}`}>{r.status}</span></td>
                  <td>{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
