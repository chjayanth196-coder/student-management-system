import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const AcademicYearsList = () => {
  const { id: institutionId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutions/${institutionId}/academic-years`);
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load academic years");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [institutionId]);

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Academic Years</h1>
          <p className="page-subtitle">Manage academic years for this institution.</p>
        </div>
        <Link className="btn btn-primary" to={`/admin/institutions/${institutionId}/academic-years/new`}>
          + Create
        </Link>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <h2 className="card-title">All Academic Years ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty-state">No academic years found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Current</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((y) => (
                <tr key={y._id}>
                  <td>{y.name}</td>
                  <td>{y.startDate ? String(y.startDate).slice(0, 10) : "—"}</td>
                  <td>{y.endDate ? String(y.endDate).slice(0, 10) : "—"}</td>
                  <td>{y.isCurrent ? "Yes" : "No"}</td>
                  <td>{y.status}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${institutionId}/academic-years/${y._id}/edit`}>
                        Edit
                      </Link>
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

export default AcademicYearsList;

