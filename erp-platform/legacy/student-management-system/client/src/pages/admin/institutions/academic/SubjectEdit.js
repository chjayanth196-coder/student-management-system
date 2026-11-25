import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";

const SubjectEdit = () => {
  const { id: institutionId, subjectId } = useParams();
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState({
    academicYearId: "",
    departmentId: "",
    classId: "",
    subjectName: "",
    subjectCode: "",
    credits: "",
    description: "",
    status: "active",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [yearsRes, subjectRes] = await Promise.all([
          api.get(`/institutions/${institutionId}/academic-years`),
          api.get(`/institutions/${institutionId}/subjects/${subjectId}`),
        ]);

        setYears(yearsRes.data || []);
        const s = subjectRes.data;

        const next = {
          academicYearId: s.academicYearId || "",
          departmentId: s.departmentId || "",
          classId: s.classId || "",
          subjectName: s.subjectName || "",
          subjectCode: s.subjectCode || "",
          credits: s.credits !== undefined && s.credits !== null ? String(s.credits) : "",
          description: s.description || "",
          status: s.status || "active",
        };
        setForm(next);

        if (next.academicYearId) {
          const { data: depsData } = await api.get(`/institutions/${institutionId}/departments`, {
            params: { academicYearId: next.academicYearId },
          });
          setDepartments(depsData || []);
        }
        if (next.academicYearId && next.departmentId) {
          const { data: classesData } = await api.get(`/institutions/${institutionId}/classes`, {
            params: { academicYearId: next.academicYearId, departmentId: next.departmentId },
          });
          setClasses(classesData || []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load subject");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [institutionId, subjectId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    const loadDepartments = async () => {
      if (!form.academicYearId) return;
      const { data } = await api.get(`/institutions/${institutionId}/departments`, {
        params: { academicYearId: form.academicYearId },
      });
      setDepartments(data || []);
      setForm((p) => ({ ...p, departmentId: data?.[0]?._id || "" }));
    };
    loadDepartments().catch(() => {});
  }, [institutionId, form.academicYearId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!form.academicYearId || !form.departmentId) return;
      const { data } = await api.get(`/institutions/${institutionId}/classes`, {
        params: { academicYearId: form.academicYearId, departmentId: form.departmentId },
      });
      setClasses(data || []);
      setForm((p) => ({ ...p, classId: data?.[0]?._id || "" }));
    };
    loadClasses().catch(() => {});
  }, [institutionId, form.academicYearId, form.departmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/institutions/${institutionId}/subjects/${subjectId}`, {
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        classId: form.classId,
        subjectName: form.subjectName,
        subjectCode: form.subjectCode,
        credits: form.credits ? Number(form.credits) : undefined,
        description: form.description,
        status: form.status,
      });
      navigate(`/admin/institutions/${institutionId}/subjects`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update subject");
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Edit Subject</h1>
          <p className="page-subtitle">Update subject details.</p>
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

          <select name="classId" value={form.classId} onChange={handleChange} required>
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className} ({c.classCode})</option>
            ))}
          </select>

          <input name="subjectName" placeholder="Subject name" value={form.subjectName} onChange={handleChange} required />
          <input name="subjectCode" placeholder="Subject code" value={form.subjectCode} onChange={handleChange} required />
          <input name="credits" placeholder="Credits (optional)" value={form.credits} onChange={handleChange} />
          <input name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />

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

export default SubjectEdit;

