import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../api/axios";


const InstitutionDashboard = () => {
  const { id } = useParams();
  const [inst, setInst] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await api.get(`/institutes/${id}`);
      setInst(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load institution");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="page-container">
      <h1 className="page-title">Institution Dashboard</h1>
      {error ? <div className="form-error">{error}</div> : null}
      {inst ? (
        <>
          <div className="card">
            <h2 className="card-title">{inst.name}</h2>
            <p className="page-subtitle">Status: {inst.isActive ? "Active" : "Inactive"}</p>
            <p><b>Type:</b> {inst.type}</p>
            <p><b>Academic Year:</b> {inst.academicYear || "—"}</p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="card-title">Academic Structure (Phase 3)</h2>
            <p className="page-subtitle" style={{ marginBottom: 12 }}>Manage Academic Years, Departments, Classes, Sections and Subjects.</p>

            <div className="stat-grid stat-grid-3">
              <Link to={`/admin/institutions/${id}/academic-years`} className="btn btn-primary">Academic Years</Link>
              <Link to={`/admin/institutions/${id}/departments`} className="btn btn-primary">Departments</Link>
              <Link to={`/admin/institutions/${id}/classes`} className="btn btn-primary">Classes</Link>
              <Link to={`/admin/institutions/${id}/sections`} className="btn btn-primary">Sections</Link>
              <Link to={`/admin/institutions/${id}/subjects`} className="btn btn-primary">Subjects</Link>
              <Link to={`/admin/institutions/${id}/staff`} className="btn btn-primary">Staff</Link>
              <Link to={`/admin/institutions/${id}/details`} className="btn btn-outline">Institution Details</Link>
            </div>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}

    </div>
  );
};

export default InstitutionDashboard;

