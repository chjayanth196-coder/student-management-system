import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import { useNavigate, useParams } from "react-router-dom";

const EditInstitution = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/institutes/${id}`);
      setForm({
        name: data.name || "",
        type: data.type || "School",
        logo: data.logo || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        principal: data.principal || "",
        academicYear: data.academicYear || "",
        isActive: !!data.isActive,
      });
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/institutes/${id}`, form);
      navigate(`/admin/institutions/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update institution");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Edit Institution</h1>
      <p className="page-subtitle">Update institution details.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <input name="name" placeholder="Institution Name" value={form.name} onChange={handleChange} required />

          <select name="type" value={form.type} onChange={handleChange}>
            <option value="School">School</option>
            <option value="College">College</option>
            <option value="University">University</option>
            <option value="Other">Other</option>
          </select>

          <input name="logo" placeholder="Logo URL (optional)" value={form.logo} onChange={handleChange} />
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
          <input name="email" type="email" placeholder="Institution Email" value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
          <input name="principal" placeholder="Principal / Director" value={form.principal} onChange={handleChange} />
          <input name="academicYear" placeholder="Academic Year" value={form.academicYear} onChange={handleChange} />

          <label style={{ gridColumn: "1 / -1" }}>
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            &nbsp; Active
          </label>

          {error && <div className="form-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditInstitution;

