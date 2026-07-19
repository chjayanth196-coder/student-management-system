import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const emptyForm = { student: "", term: "", year: "", subject: "", marksObtained: "", maxMarks: "", remarks: "" };

const ManageResults = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(emptyForm);
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

  const loadResults = async (studentId) => {
    if (!studentId) { setResults([]); return; }
    const { data } = await api.get(`/results/student/${studentId}`);
    setResults(data);
  };

  const handleSelectStudent = (e) => {
    const id = e.target.value;
    setSelectedStudent(id);
    setForm({ ...emptyForm, student: id });
    loadResults(id);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/results", {
        ...form,
        marksObtained: Number(form.marksObtained),
        maxMarks: Number(form.maxMarks),
      });
      await loadResults(selectedStudent);
      setForm({ ...emptyForm, student: selectedStudent });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this result?")) return;
    await api.delete(`/results/${id}`);
    await loadResults(selectedStudent);
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Manage Results</h1>
      <p className="page-subtitle">Select a student, then add or review their exam results.</p>

      <div className="card">
        <label className="field-label">Student</label>
        <select value={selectedStudent} onChange={handleSelectStudent} className="select-input">
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.name} {s.rollNo ? `(${s.rollNo})` : ""}</option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <>
          <div className="card">
            <h2 className="card-title">Add Result</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <input name="term" placeholder="Term (e.g. Mid-Term)" value={form.term} onChange={handleChange} required />
              <input name="year" placeholder="Year (e.g. 2025-2026)" value={form.year} onChange={handleChange} required />
              <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required />
              <input name="marksObtained" type="number" min="0" placeholder="Marks Obtained" value={form.marksObtained} onChange={handleChange} required />
              <input name="maxMarks" type="number" min="1" placeholder="Max Marks" value={form.maxMarks} onChange={handleChange} required />
              <input name="remarks" placeholder="Remarks (optional)" value={form.remarks} onChange={handleChange} />
              {error && <div className="form-error">{error}</div>}
              <button type="submit" className="btn btn-primary">Save Result</button>
            </form>
          </div>

          <div className="card">
            <h2 className="card-title">Result History</h2>
            {results.length === 0 ? (
              <p className="empty-state">No results recorded for this student yet.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Term</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Actions</th></tr></thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id}>
                      <td>{r.term} ({r.year})</td>
                      <td>{r.subject}</td>
                      <td>{r.marksObtained}/{r.maxMarks}</td>
                      <td><span className="grade-pill">{r.grade}</span></td>
                      <td><button className="btn btn-small btn-danger" onClick={() => handleDelete(r._id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageResults;
