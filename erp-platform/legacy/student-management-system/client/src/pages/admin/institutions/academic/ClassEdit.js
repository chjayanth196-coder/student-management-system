import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const ClassEdit = () => {
  const { id: institutionId, classId } = useParams();
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    academicYearId: "",
    departmentId: "",
    className: "",
    classCode: "",
    semesterOrGrade: "",
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

        const [yearsRes, classRes] = await Promise.all([
          api.get(`/institutions/${institutionId}/academic-years`),
          api.get(`/institutions/${institutionId}/classes/${classId}`),
        ]);
        const c = classRes.data;
        setYears(yearsRes.data || []);

        const nextForm = {
          academicYearId: c.academicYearId?._id || c.academicYearId || "",
          departmentId: c.departmentId || "",
          className: c.className || "",
          classCode: c.classCode || "",
          semesterOrGrade: c.semesterOrGrade || "",
          capacity: c.capacity !== undefined && c.capacity !== null ? String(c.capacity) : "",
          status: c.status || "active",
        };
        setForm(nextForm);

        if (nextForm.academicYearId) {
          const { data: depsData } = await api.get(`/institutions/${institutionId}/departments`, {
            params: { academicYearId: nextForm.academicYearId },
          });
          setDepartments(depsData || []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load class");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [institutionId, classId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const loadDepartments = async () => {
      if (!form.academicYearId) return;
      try {
        const { data } = await api.get(`/institutions/${institutionId}/departments`, {
          params: { academicYearId: form.academicYearId },
        });
        setDepartments(data);
      } catch (err) {
        // Keep quiet; user will see error on submit.
      }
    };
    loadDepartments();
  }, [institutionId, form.academicYearId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/institutions/${institutionId}/classes/${classId}`, {
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        className: form.className,
        classCode: form.classCode,
        semesterOrGrade: form.semesterOrGrade,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        status: form.status,
      });
      navigate(`/admin/institutions/${institutionId}/classes`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update class");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Edit Class</h1>
          <p className="page-subtitle">Update class details.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="academicYearId" value={form.academicYearId} onChange={handleChange} required>
            <option value="">Select Academic Year</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>{y.name}</option>
            ))}
          </select>

          <select name="departmentId" value={form.departmentId} onChange={handleChange} required>
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <input name="className" placeholder="Class name" value={form.className} onChange={handleChange} required />
          <input name="classCode" placeholder="Class code" value={form.classCode} onChange={handleChange} required />
          <input name="semesterOrGrade" placeholder="Semester/Grade (optional)" value={form.semesterOrGrade} onChange={handleChange} />
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

export default ClassEdit;

