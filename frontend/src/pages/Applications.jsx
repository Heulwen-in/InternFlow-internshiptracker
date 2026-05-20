import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteApplication, getApplications } from "../api/applicationApi";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getApplications();
        if (!cancelled) setApplications(res.data.applications);
      } catch {
        if (!cancelled) setError("Failed to load applications");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this application?")) return;

    await deleteApplication(id);
    setApplications((current) => current.filter((app) => app.id !== id));
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Applications</h1>
          <p>Track every internship and job application.</p>
        </div>
        <Link className="button-link" to="/applications/new">
          Add Application
        </Link>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Deadline</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.company?.name}</td>
                <td>{application.roleTitle}</td>
                <td>
                  <span className="status" data-status={application.status}>
                    {application.status}
                  </span>
                </td>
                <td>
                  {application.deadline
                    ? new Date(application.deadline).toLocaleDateString()
                    : "No deadline"}
                </td>
                <td>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => handleDelete(application.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {applications.length === 0 && (
              <tr>
                <td colSpan="5">No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Applications;