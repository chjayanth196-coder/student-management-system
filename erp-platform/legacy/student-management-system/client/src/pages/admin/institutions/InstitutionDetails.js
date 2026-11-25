import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../api/axios";

const InstitutionDetails = () => {
  const { id } = useParams();
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/institutes/${id}`);
      setInst(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load institution");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="page-container"><p>Loading...</p></div>;
  if (error) return <div className="page-container"><div className="form-error">{error}</div></div>;
  if (!inst) return null;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{inst.name}</h1>
          <p className="page-subtitle">Institution details & status.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn btn-outline" to={`/admin/institutions/${id}/edit`}>Edit</Link>
          <Link className="btn btn-primary" to={`/admin/institutions/${id}`}>Dashboard</Link>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Overview</h2>
        <div className="details-grid">
          <div><b>Type:</b> {inst.type}</div>
          <div><b>Academic Year:</b> {inst.academicYear || "—"}</div>
          <div><b>Status:</b> {inst.isActive ? "Active" : "Inactive"}</div>
          <div><b>Principal:</b> {inst.principal || "—"}</div>
        </div>

        <hr />

        <div className="details-grid">
          <div><b>Email:</b> {inst.email || "—"}</div>
          <div><b>Phone:</b> {inst.phone || "—"}</div>
          <div><b>Website:</b> {inst.website || "—"}</div>
          <div>
            <b>Address:</b> {inst.address || "—"}
            {inst.city || inst.state || inst.country ? (
              <div style={{ marginTop: 4, color: "#666" }}>
                {[inst.city, inst.state, inst.country].filter(Boolean).join(", ")}
              </div>
            ) : null}
          </div>
        </div>

        {inst.logo ? (
          <div style={{ marginTop: 14 }}>
            <img src={inst.logo} alt="logo" style={{ maxWidth: 180, maxHeight: 80 }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InstitutionDetails;

