import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const DepartmentList = () => {
  const { id: institutionId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutions/${institutionId}/departments`, {
        params: academicYearId ? { academicYearId } : undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [institutionId, academicYearId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage departments for this institution.</p>
        </div>
        <Link className="btn btn-primary" to={`/admin/institutions/${institutionId}/departments/new`}>+ Create</Link>
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
          <button type="button" className="btn btn-small btn-outline" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">All Departments ({items.length})</h2>
        {loading ? <p>Loading...</p> : items.length === 0 ? <p className="empty-state">No departments found.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.code}</td>
                  <td>{d.academicYearId}</td>
                  <td>{d.status}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${institutionId}/departments/${d._id}/edit`}>Edit</Link>
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

export default DepartmentList;

