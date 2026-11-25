import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

const AcademicYearCreate = () => {
  const { id: institutionId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    status: "active",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(`/institutions/${institutionId}/academic-years`, {
        ...form,
      });
      navigate(`/admin/institutions/${institutionId}/academic-years`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create academic year");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Create Academic Year</h1>
          <p className="page-subtitle">Set details and optionally mark as current.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input name="name" placeholder="Academic year name" value={form.name} onChange={handleChange} required />
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
          <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />

          <label style={{ gridColumn: "span 2" }}>
            <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={handleChange} /> Is Current
          </label>

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearCreate;

