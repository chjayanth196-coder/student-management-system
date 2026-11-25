import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const ClassList = () => {
  const { id: institutionId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [academicYearId, setAcademicYearId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutions/${institutionId}/classes`, {
        params: {
          academicYearId: academicYearId || undefined,
          departmentId: departmentId || undefined,
        },
      });
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [institutionId, academicYearId, departmentId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">Manage classes for this institution.</p>
        </div>
        <Link className="btn btn-primary" to={`/admin/institutions/${institutionId}/classes/new`}>+ Create</Link>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Filter</h2>
        <div className="form-grid">
          <input
            placeholder="academicYearId (optional)"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
          />
          <input
            placeholder="departmentId (optional)"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          />
          <button type="button" className="btn btn-small btn-outline" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">All Classes ({items.length})</h2>
        {loading ? <p>Loading...</p> : items.length === 0 ? <p className="empty-state">No classes found.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Class Code</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td>{c.className}</td>
                  <td>{c.classCode}</td>
                  <td>{c.departmentId}</td>
                  <td>{c.status}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${institutionId}/classes/${c._id}/edit`}>Edit</Link>
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

export default ClassList;

