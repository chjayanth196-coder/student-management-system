import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
        <div className="card">
          <h2 className="card-title">{inst.name}</h2>
          <p className="page-subtitle">Status: {inst.isActive ? "Active" : "Inactive"}</p>
          <p><b>Type:</b> {inst.type}</p>
          <p><b>Academic Year:</b> {inst.academicYear || "—"}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default InstitutionDashboard;

