import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../api/axios";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  alternatePhone: "",
  dob: "",
  address: "",
  staffType: "Teacher",
  gender: "",
  joiningDate: "",
  qualification: "",
  specialization: "",
  experience: "",
  designation: "",
  departmentId: "",
  assignedClassId: "",
  assignedSectionId: "",
  assignedSubjectIds: [],
  classTeacher: false,
  photo: "",
};

const ManageStaff = () => {
  const { id: institutionId } = useParams();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [staffType, setStaffType] = useState("");
  const [status, setStatus] = useState("");

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const title = useMemo(() => (editingId ? "Edit Staff" : "Add Staff"), [editingId]);

  const fetchLists = async () => {
    try {
      // Academic structure lists (existing Phase 3 APIs)
      const [{ data: depData }, { data: classData }, { data: secData }, { data: subjData }] = await Promise.all([
        api.get(`/institutions/${institutionId}/departments`),
        api.get(`/institutions/${institutionId}/classes`),
        api.get(`/institutions/${institutionId}/sections`),
        api.get(`/institutions/${institutionId}/subjects`),
      ]);

      // Existing controllers typically return arrays.
      setDepartments(depData);
      setClasses(classData);
      setSections(secData);
      setSubjects(subjData);
    } catch (e) {
      // Keep non-fatal
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/institutions/${institutionId}/staff`, {
        params: {
          search: search || undefined,
          staffType: staffType || undefined,
          status: status || undefined,
          limit: 50,
        },
      });

      // API may return {items} or array; support both.
      const items = Array.isArray(data) ? data : data?.items || [];
      setStaff(items);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  useEffect(() => {
    // When assigned class changes, filter sections/subjects in UI.
    // This is best-effort (no backend enforcement here).
    if (!form.assignedClassId) {
      return;
    }
    setSections((prev) => prev);
    setSubjects((prev) => prev);
  }, [form.assignedClassId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        const payload = { ...form };
        delete payload.password;
        await api.put(`/institutions/${institutionId}/staff/${editingId}`, payload);
      } else {
        await api.post(`/institutions/${institutionId}/staff`, form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadStaff();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message || "Failed to save staff");
    }
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm((f) => ({
      ...f,
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      email: s.email || "",
      phone: s.phone || "",
      alternatePhone: s.alternatePhone || "",
      dob: s.dob ? s.dob.slice(0, 10) : "",
      address: s.address || "",
      staffType: s.staffType || "Teacher",
      gender: s.gender || "",
      joiningDate: s.joiningDate ? s.joiningDate.slice(0, 10) : "",
      qualification: s.qualification || "",
      specialization: s.specialization || "",
      experience: s.experience || "",
      designation: s.designation || "",
      departmentId: s.departmentId || "",
      assignedClassId: s.assignedClassId || "",
      assignedSectionId: s.assignedSectionId || "",
      assignedSubjectIds: s.assignedSubjectIds || [],
      classTeacher: !!s.classTeacher,
      photo: s.photo || "",
      password: "",
    }));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft delete this staff?")) return;
    try {
      await api.delete(`/institutions/${institutionId}/staff/${id}`);
      await loadStaff();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to delete");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Create staff, assign department/class/section/subjects.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      {/* Filters */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Filters</h2>
        <div className="form-grid">
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input placeholder="Staff Type" value={staffType} onChange={(e) => setStaffType(e.target.value)} />
          <input placeholder="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-outline" onClick={loadStaff}>Apply</button>
        </div>
      </div>

      {/* Form */}
      {showForm ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="card-title">{title}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
            <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            {!editingId ? (
              <input name="password" type="password" placeholder="Temporary Password" value={form.password} onChange={handleChange} required />
            ) : null}

            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="alternatePhone" placeholder="Alternate Phone" value={form.alternatePhone} onChange={handleChange} />
            <input name="dob" type="date" value={form.dob} onChange={handleChange} />
            <input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
            <input name="gender" placeholder="Gender" value={form.gender} onChange={handleChange} />
            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />

            <input name="staffType" placeholder="Staff Type (Teacher, HOD, etc.)" value={form.staffType} onChange={handleChange} />

            <select name="departmentId" value={form.departmentId} onChange={handleChange}>
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name || d.title || d.departmentName || d._id}</option>
              ))}
            </select>

            <select name="assignedClassId" value={form.assignedClassId} onChange={handleChange}>
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name || c.className || c._id}</option>
              ))}
            </select>

            <select name="assignedSectionId" value={form.assignedSectionId} onChange={handleChange}>
              <option value="">Select Section</option>
              {sections
                .filter((s) => !form.assignedClassId || String(s.classId) === String(form.assignedClassId))
                .map((s) => (
                  <option key={s._id} value={s._id}>{s.name || s.sectionName || s._id}</option>
                ))}
            </select>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  name="classTeacher"
                  type="checkbox"
                  checked={!!form.classTeacher}
                  onChange={handleChange}
                />
                Class Teacher (Only one per section)
              </label>
            </div>

            {/* subjects assignment (simple multi-select) */}
            <select
              multiple
              value={form.assignedSubjectIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map((o) => o.value);
                setForm((f) => ({ ...f, assignedSubjectIds: options }));
              }}
              style={{ minHeight: 80 }}
            >
              {subjects
                .filter((sub) => !form.assignedClassId || String(sub.classId) === String(form.assignedClassId))
                .map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name || sub.subjectName || sub._id}</option>
                ))}
            </select>

            <input name="qualification" placeholder="Qualification" value={form.qualification} onChange={handleChange} />
            <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} />
            <input name="experience" placeholder="Experience" value={form.experience} onChange={handleChange} />
            <input name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} />

            <input name="photo" placeholder="Photo URL/Path" value={form.photo} onChange={handleChange} />

            <button type="submit" className="btn btn-primary">{editingId ? "Save" : "Create"}</button>
          </form>
        </div>
      ) : null}

      {/* Table */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">All Staff</h2>
        {loading ? <p>Loading…</p> : null}
        {!loading && staff.length === 0 ? <p className="empty-state">No staff found.</p> : null}

        {!loading && staff.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Department</th>
                <th>Class/Section</th>
                <th>Class Teacher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id}>
                  <td>{s.employeeId || "—"}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>{s.staffType}</td>
                  <td>{s.departmentId || "—"}</td>
                  <td>
                    {s.assignedClassId
                      ? `${s.assignedClassId}${s.assignedSectionId ? "-" + s.assignedSectionId : ""}`
                      : "—"}
                  </td>
                  <td>{s.classTeacher ? "Yes" : "No"}</td>
                  <td>{s.status || "active"}</td>
                  <td className="table-actions">
                    <button className="btn btn-small btn-outline" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
};

export default ManageStaff;

