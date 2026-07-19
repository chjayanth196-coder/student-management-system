import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const SubjectList = () => {
  const { id: institutionId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [academicYearId, setAcademicYearId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [classId, setClassId] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutions/${institutionId}/subjects`, {
        params: {
          academicYearId: academicYearId || undefined,
          departmentId: departmentId || undefined,
          classId: classId || undefined,
        },
      });
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [institutionId, academicYearId, departmentId, classId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">Manage subjects for this institution.</p>
        </div>
        <Link className="btn btn-primary" to={`/admin/institutions/${institutionId}/subjects/new`}>+ Create</Link>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Filter</h2>
        <div className="form-grid">
          <input placeholder="academicYearId (optional)" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} />
          <input placeholder="departmentId (optional)" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
          <input placeholder="classId (optional)" value={classId} onChange={(e) => setClassId(e.target.value)} />
          <button type="button" className="btn btn-small btn-outline" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">All Subjects ({items.length})</h2>
        {loading ? <p>Loading...</p> : items.length === 0 ? <p className="empty-state">No subjects found.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Class</th>
                <th>Credits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td>{s.subjectName}</td>
                  <td>{s.subjectCode}</td>
                  <td>{s.classId}</td>
                  <td>{s.credits !== undefined && s.credits !== null ? s.credits : "—"}</td>
                  <td>{s.status}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${institutionId}/subjects/${s._id}/edit`}>Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubjectList;

