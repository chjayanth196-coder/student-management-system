import React from "react";
import { useAuth } from "../../context/AuthContext";

const Field = ({ label, value }) => (
  <div className="profile-field">
    <span className="profile-label">{label}</span>
    <span className="profile-value">{value || "—"}</span>
  </div>
);

const StudentProfile = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Read-only — contact your school administrator to update these details.</p>

      <div className="card">
        <div className="profile-grid">
          <Field label="Full Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Roll Number" value={user.rollNo} />
          <Field label="Class" value={user.class} />
          <Field label="Section" value={user.section} />
          <Field label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : ""} />
          <Field label="Phone" value={user.phone} />
          <Field label="Address" value={user.address} />
          <Field label="Parent / Guardian" value={user.parentName} />
          <Field label="Parent Phone" value={user.parentPhone} />
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
