import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const emptyForm = {
  name: "", email: "", password: "", rollNo: "", class: "", section: "",
  dob: "", phone: "", address: "", parentName: "", parentPhone: "",
};

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    const { data } = await api.get("/students");
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { loadStudents(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        const payload = { ...form };
        delete payload.password; // password not editable here
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post("/students", form);
      }
      await loadStudents();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name || "", email: student.email || "", password: "",
      rollNo: student.rollNo || "", class: student.className || "", section: student.section || "",
      dob: student.dob ? student.dob.slice(0, 10) : "",
      phone: student.phone || "", address: student.address || "",
      parentName: student.parentName || "", parentPhone: student.parentPhone || "",
    });
    setEditingId(student._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this student? This cannot be undone.")) return;
    await api.delete(`/students/${id}`);
    await loadStudents();
  };

  if (loading) return <div className="page-container"><p>Loading students...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">Add, edit, or remove student accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "Cancel" : "+ Add Student"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="card-title">{editingId ? "Edit Student" : "New Student"}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            {!editingId && (
              <input name="password" type="password" placeholder="Temporary Password" value={form.password} onChange={handleChange} required />
            )}
            <input name="rollNo" placeholder="Roll Number" value={form.rollNo} onChange={handleChange} />
            <input name="class" placeholder="Class (e.g. 10)" value={form.class} onChange={handleChange} />
            <input name="section" placeholder="Section (e.g. A)" value={form.section} onChange={handleChange} />
            <input name="dob" type="date" value={form.dob} onChange={handleChange} />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
            <input name="parentName" placeholder="Parent / Guardian Name" value={form.parentName} onChange={handleChange} />
            <input name="parentPhone" placeholder="Parent Phone" value={form.parentPhone} onChange={handleChange} />

            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Create Student"}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">All Students ({students.length})</h2>
        {students.length === 0 ? (
          <p className="empty-state">No students yet.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Roll No.</th><th>Class</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.rollNo || "—"}</td>
                  <td>{s.className ? `${s.className}${s.section ? "-" + s.section : ""}` : "—"}</td>
                  <td>{s.email}</td>
                  <td className="table-actions">
                    <button className="btn btn-small btn-outline" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
