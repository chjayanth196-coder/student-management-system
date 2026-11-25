import React, { useState } from "react";
import api from "../api/axios";

const RegisterInstitute = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("school");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/institutes/register", { name, type, code });
      setSuccess("Institute registered successfully.");
      setName("");
      setCode("");
      setType("school");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to register institute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Register College / School</h1>
      <p className="page-subtitle">Create an institute record. Teachers will manage students and classes after that.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Institute Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="university">University</option>
            </select>
          </label>

          <label>
            Institute Code (example: SCH001)
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterInstitute;

