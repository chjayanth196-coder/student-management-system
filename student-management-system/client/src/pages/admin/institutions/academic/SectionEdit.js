import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const SectionEdit = () => {
  const { id: institutionId, sectionId } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ classId: "", sectionName: "", roomNumber: "", capacity: "", status: "active" });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [classesRes, sectionRes] = await Promise.all([
          api.get(`/institutions/${institutionId}/classes`),
          api.get(`/institutions/${institutionId}/sections/${sectionId}`),
        ]);
        setClasses(classesRes.data || []);
        const s = sectionRes.data;
        setForm({
          classId: s.classId || "",
          sectionName: s.sectionName || "",
          roomNumber: s.roomNumber || "",
          capacity: s.capacity !== undefined && s.capacity !== null ? String(s.capacity) : "",
          status: s.status || "active",
        });
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load section");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [institutionId, sectionId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/institutions/${institutionId}/sections/${sectionId}`, {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
      navigate(`/admin/institutions/${institutionId}/sections`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update section");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Edit Section</h1>
          <p className="page-subtitle">Update details.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="classId" value={form.classId} onChange={handleChange} required>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className} ({c.classCode})</option>
            ))}
          </select>
          <input name="sectionName" placeholder="Section name" value={form.sectionName} onChange={handleChange} required />
          <input name="roomNumber" placeholder="Room number (optional)" value={form.roomNumber} onChange={handleChange} />
          <input name="capacity" placeholder="Capacity (optional)" value={form.capacity} onChange={handleChange} />
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

export default SectionEdit;

