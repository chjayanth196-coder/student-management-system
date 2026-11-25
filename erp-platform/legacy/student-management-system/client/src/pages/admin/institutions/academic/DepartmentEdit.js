import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const DepartmentEdit = () => {
  const { id: institutionId, departmentId } = useParams();
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [form, setForm] = useState({ academicYearId: "", name: "", code: "", description: "", hodName: "", status: "active" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [yearsRes, deptRes] = await Promise.all([
          api.get(`/institutions/${institutionId}/academic-years`),
          api.get(`/institutions/${institutionId}/departments/${departmentId}`),
        ]);

        setYears(yearsRes.data || []);
        const d = deptRes.data;
        setForm({
          academicYearId: d.academicYearId || "",
          name: d.name || "",
          code: d.code || "",
          description: d.description || "",
          hodName: d.hodName || "",
          status: d.status || "active",
        });
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load department");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [institutionId, departmentId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/institutions/${institutionId}/departments/${departmentId}`, form);
      navigate(`/admin/institutions/${institutionId}/departments`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update department");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Edit Department</h1>
          <p className="page-subtitle">Update details.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="academicYearId" value={form.academicYearId} onChange={handleChange} required>
            {years.map((y) => (
              <option key={y._id} value={y._id}>{y.name}</option>
            ))}
          </select>
          <input name="name" placeholder="Department name" value={form.name} onChange={handleChange} required />
          <input name="code" placeholder="Department code" value={form.code} onChange={handleChange} required />
          <input name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />
          <input name="hodName" placeholder="HOD name (optional)" value={form.hodName} onChange={handleChange} />
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentEdit;

