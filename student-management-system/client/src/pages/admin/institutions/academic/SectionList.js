import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const SectionList = () => {
  const { id: institutionId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [classId, setClassId] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/institutions/${institutionId}/sections`, {
        params: classId ? { classId } : undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [institutionId, classId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Sections</h1>
          <p className="page-subtitle">Manage sections for this institution.</p>
        </div>
        <Link className="btn btn-primary" to={`/admin/institutions/${institutionId}/sections/new`}>+ Create</Link>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Filter</h2>
        <div className="form-grid">
          <input
            placeholder="classId (optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <button type="button" className="btn btn-small btn-outline" onClick={load}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">All Sections ({items.length})</h2>
        {loading ? <p>Loading...</p> : items.length === 0 ? <p className="empty-state">No sections found.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Class</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td>{s.sectionName}</td>
                  <td>{s.classId}</td>
                  <td>{s.roomNumber || "—"}</td>
                  <td>{s.status}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="btn btn-small btn-outline" to={`/admin/institutions/${institutionId}/sections/${s._id}/edit`}>Edit</Link>
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

export default SectionList;

