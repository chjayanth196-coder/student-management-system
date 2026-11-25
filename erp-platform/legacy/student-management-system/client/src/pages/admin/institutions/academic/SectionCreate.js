import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const SectionCreate = () => {
  const { id: institutionId } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    classId: "",
    sectionName: "",
    roomNumber: "",
    capacity: "",
    status: "active",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/institutions/${institutionId}/classes`);
        setClasses(data || []);
        setForm((p) => ({ ...p, classId: data?.[0]?._id || "" }));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [institutionId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/institutions/${institutionId}/sections`, {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
      navigate(`/admin/institutions/${institutionId}/sections`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create section");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Create Section</h1>
          <p className="page-subtitle">Add section under a class.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="classId" value={form.classId} onChange={handleChange} required>
            <option value="">Select Class</option>
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

          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
};

export default SectionCreate;

