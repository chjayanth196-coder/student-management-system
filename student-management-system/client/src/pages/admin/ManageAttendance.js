import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const emptyForm = { student: "", date: "", status: "Present", subject: "General", remarks: "" }; 

const emptyBulkForm = { date: "", status: "Present", subject: "General", remarks: "" };

const ManageAttendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [records, setRecords] = useState([]);

  // single student form
  const [form, setForm] = useState(emptyForm);

  // bulk slot form
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/students");
      setStudents(data);
      setLoading(false);
    };
    load();
  }, []);

  const loadAttendance = async (studentId) => {
    if (!studentId) { setRecords([]); return; }
    const { data } = await api.get(`/attendance/student/${studentId}`);
    setRecords(data);
  };

  const handleSelectStudent = (e) => {
    const id = e.target.value;
    setSelectedStudent(id);
    setForm({ ...emptyForm, student: id });
    loadAttendance(id);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleBulkToggle = () => {
    setBulkMode((v) => !v);
    setError("");
    setSelectedStudent("");
    setRecords([]);
  };

  const handleBulkChange = (e) => setBulkForm({ ...bulkForm, [e.target.name]: e.target.value });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/attendance", form);
      await loadAttendance(selectedStudent);
      setForm({ ...emptyForm, student: selectedStudent });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/attendance/bulk", bulkForm);
      setBulkForm({ ...emptyBulkForm });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance record?")) return;
    await api.delete(`/attendance/${id}`);
    await loadAttendance(selectedStudent);
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Manage Attendance</h1>
      <p className="page-subtitle">Select a student, then mark or review their attendance.</p>

      <div className="card">
        <label className="field-label">Student</label>
        <select value={selectedStudent} onChange={handleSelectStudent} className="select-input">
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.name} {s.rollNo ? `(${s.rollNo})` : ""}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Attendance Entry Mode</h2>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <button
            type="button"
            className={bulkMode ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => {
              setBulkMode(true);
              setError("");
              setSelectedStudent("");
              setRecords([]);
            }}
          >
            Give Attendance to ALL (Bulk Slot)
          </button>
          <button
            type="button"
            className={!bulkMode ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => {
              setBulkMode(false);
              setError("");
              setRecords([]);
            }}
          >
            Give Attendance Student-wise
          </button>
        </div>
      </div>

      {bulkMode ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="card-title">Bulk Slot</h2>
          <p className="page-subtitle">Set date/subject, then click Present/Absent/Late to mark all students.</p>

          <form onSubmit={handleBulkSubmit} className="form-grid">
            <input name="date" type="date" value={bulkForm.date} onChange={handleBulkChange} required />
            <input name="subject" placeholder="Subject / Period" value={bulkForm.subject} onChange={handleBulkChange} />
            <input name="remarks" placeholder="Remarks (optional)" value={bulkForm.remarks} onChange={handleBulkChange} />

            {error && <div className="form-error">{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setBulkForm({ ...bulkForm, status: "Present" });
                }}
              >
                Present
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setBulkForm({ ...bulkForm, status: "Absent" });
                }}
              >
                Absent
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setBulkForm({ ...bulkForm, status: "Late" });
                }}
              >
                Late
              </button>
            </div>

            <button type="submit" className="btn btn-primary">Mark All</button>
          </form>
        </div>
      ) : (
        selectedStudent && (
          <>
            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="card-title">Mark Attendance</h2>
              <form onSubmit={handleSubmit} className="form-grid">
                <input name="date" type="date" value={form.date} onChange={handleChange} required />
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
                <input name="subject" placeholder="Subject / Period" value={form.subject} onChange={handleChange} />
                <input name="remarks" placeholder="Remarks (optional)" value={form.remarks} onChange={handleChange} />
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="btn btn-primary">Save Attendance</button>
              </form>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="card-title">Attendance History</h2>
              {records.length === 0 ? (
                <p className="empty-state">No attendance recorded for this student yet.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td>{new Date(r.date).toLocaleDateString()}</td>
                        <td>{r.subject}</td>
                        <td>{r.status}</td>
                        <td>{r.remarks || "—"}</td>
                        <td><button className="btn btn-small btn-danger" onClick={() => handleDelete(r._id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Phase 5 starter: basic daily summary for selected student */}
            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="card-title">Today Summary</h2>
              <button
                className="btn btn-small btn-outline"
                type="button"
                onClick={async () => {
                  try {
                    const today = new Date();
                    const iso = today.toISOString().slice(0, 10);
                    // institutionId is already available via auth context in other admin pages.
                    // ManageAttendance.js currently doesn't read it, so we fall back to an env var if provided.
                    const institutionId = process.env.REACT_APP_INSTITUTION_ID || "";
                    if (!institutionId) throw new Error("Missing institutionId for tenant-scoped attendance reports");
                    const payload = await api.get(`/institutions/${institutionId}/attendance/reports/daily/summary`, { params: { date: iso, studentId: selectedStudent } });
                    alert(`Present: ${payload.data.present}, Absent: ${payload.data.absent}, Late: ${payload.data.late}, Percentage: ${payload.data.percentage}%`);
                  } catch (e) {
                    alert(e?.response?.data?.message || "Unable to load summary");
                  }
                }}
              >
                Load Daily Summary
              </button>
              <p className="page-subtitle" style={{ marginTop: 8 }}>Uses Phase 5 tenant-aware endpoint.</p>
            </div>

          </>
        )
      )}

    </div>
  );
};

export default ManageAttendance;
