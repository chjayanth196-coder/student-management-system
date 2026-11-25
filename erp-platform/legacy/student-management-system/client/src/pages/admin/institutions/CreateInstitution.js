import React, { useState } from "react";
import api from "../../../api/axios";
import { useNavigate } from "react-router-dom";

const CreateInstitution = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // Institution
    name: "",
    type: "School",
    logo: "",
    address: "",
    city: "",
    state: "",
    country: "",
    email: "",
    phone: "",
    website: "",
    principal: "",
    academicYear: "",
    isActive: true,

    // Institution Admin
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    adminConfirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        type: form.type,
        logo: form.logo,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        email: form.email,
        phone: form.phone,
        website: form.website,
        principal: form.principal,
        academicYear: form.academicYear,
        isActive: form.isActive,

        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
        adminPassword: form.adminPassword,
        adminConfirmPassword: form.adminConfirmPassword,
      };

      const { data } = await api.post("/institutes", payload);

      setSuccessMsg(
        `✅ ${data.institutionName} created. First Institution Admin: ${data.adminEmail}`
      );

      // Navigate after creation to details
      setTimeout(() => {
        navigate(`/admin/institutions/${data.institutionId}`);
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create institution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Create Institution</h1>
      <p className="page-subtitle">Super Admin: create an institution and its first Institution Admin.</p>

      <div className="card">
        <h2 className="card-title">Institution Information</h2>
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
          <input name="academicYear" placeholder="Academic Year (e.g. 2024-2025)" value={form.academicYear} onChange={handleChange} />

          <label style={{ gridColumn: "1 / -1" }}>
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            &nbsp; Active
          </label>

          <hr style={{ gridColumn: "1 / -1", width: "100%" }} />

          <h2 className="card-title" style={{ gridColumn: "1 / -1" }}>Institution Admin Information</h2>

          <input name="adminName" placeholder="Admin Name" value={form.adminName} onChange={handleChange} required />
          <input name="adminEmail" type="email" placeholder="Admin Email" value={form.adminEmail} onChange={handleChange} required />
          <input name="adminPhone" placeholder="Admin Phone (optional)" value={form.adminPhone} onChange={handleChange} />
          <input name="adminPassword" type="password" placeholder="Admin Password" value={form.adminPassword} onChange={handleChange} required />
          <input name="adminConfirmPassword" type="password" placeholder="Confirm Password" value={form.adminConfirmPassword} onChange={handleChange} required />

          {error && <div className="form-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          {successMsg && <div className="form-success" style={{ gridColumn: "1 / -1" }}>{successMsg}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Institution + Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateInstitution;

