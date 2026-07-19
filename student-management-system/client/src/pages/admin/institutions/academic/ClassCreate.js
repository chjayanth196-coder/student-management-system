import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const ClassCreate = () => {
  const { id: institutionId } = useParams();
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
    const loadYearsAndDeps = async () => {
      try {
        setLoading(true);
        setError("");
        const { data: yearsData } = await api.get(`/institutions/${institutionId}/academic-years`);
        setYears(yearsData);

        const currentYear = yearsData.find((y) => y.isCurrent) || yearsData[0];
        const academicYearId = currentYear?._id || "";

        setForm((p) => ({
          ...p,
          academicYearId,
        }));

        const { data: depsData } = await api.get(`/institutions/${institutionId}/departments`, {
          params: academicYearId ? { academicYearId } : undefined,
        });
        setDepartments(depsData);
        const firstDep = depsData[0];
        setForm((p) => ({ ...p, departmentId: firstDep?._id || "" }));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load prerequisites");
      } finally {
        setLoading(false);
      }
    };

    loadYearsAndDeps();
  }, [institutionId]);

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
        setForm((p) => ({ ...p, departmentId: data?.[0]?._id || "" }));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load departments");
      }
    };
    loadDepartments();
  }, [institutionId, form.academicYearId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/institutions/${institutionId}/classes`, {
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
      setError(err?.response?.data?.message || err.message || "Failed to create class");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Create Class</h1>
          <p className="page-subtitle">Add a class under a department and academic year.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Back</button>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <select name="academicYearId" value={form.academicYearId} onChange={handleChange} required>
            <option value="">Select Academic Year</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>{y.name} {y.isCurrent ? "(Current)" : ""}</option>
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

          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
};

export default ClassCreate;

