import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import { Link } from "react-router-dom";

const InstitutionsList = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, type, status]);

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutes${queryString}`);
      setInstitutions(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  if (loading) return <div className="page-container"><p>Loading institutions...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Institutions</h1>
          <p className="page-subtitle">Search, filter, and manage institution records.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/institutions/new">+ Create Institution</Link>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Filters</h2>
        <div className="form-grid">
          <input
            placeholder="Search by name/email/principal"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="School">School</option>
            <option value="College">College</option>
            <option value="University">University</option>
            <option value="Other">Other</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="button" className="btn btn-small btn-outline" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">All Institutions ({institutions.length})</h2>
        {institutions.length === 0 ? (
          <p className="empty-state">No institutions found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
                  <td>{inst.name}</td>
                  <td>{inst.type}</td>
                  <td>{inst.academicYear || "—"}</td>
                  <td>{inst.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${inst._id}`}>Details</Link>
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${inst._id}/edit`}>Edit</Link>
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

export default InstitutionsList;

