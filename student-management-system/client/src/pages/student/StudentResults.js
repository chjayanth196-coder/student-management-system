import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const StudentResults = () => {
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/results/me");
      setSummary(data.summary);
      setResults(data.results);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="page-container"><p>Loading results...</p></div>;

  // Group results by term + year for a clearer report-card view
  const grouped = results.reduce((acc, r) => {
    const key = `${r.term} — ${r.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <h1 className="page-title">My Results</h1>
      <p className="page-subtitle">Your subject-wise scores across every term.</p>

      <div className="stat-grid stat-grid-3">
        <div className="stat-card"><span className="stat-label">Overall %</span><span className="stat-value">{summary.overallPercentage}%</span></div>
        <div className="stat-card"><span className="stat-label">Marks Obtained</span><span className="stat-value">{summary.totalObtained}</span></div>
        <div className="stat-card"><span className="stat-label">Marks Possible</span><span className="stat-value">{summary.totalMax}</span></div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card"><p className="empty-state">No results have been added yet.</p></div>
      ) : (
        Object.entries(grouped).map(([term, rows]) => (
          <div className="card" key={term}>
            <h2 className="card-title">{term}</h2>
            <table className="data-table">
              <thead>
                <tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td>{r.subject}</td>
                    <td>{r.marksObtained}/{r.maxMarks}</td>
                    <td><span className="grade-pill">{r.grade}</span></td>
                    <td>{r.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentResults;
