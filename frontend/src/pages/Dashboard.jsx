import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications } from "../api/applicationApi";
import { useAuth } from "../context/useAuth";

const statuses = ["Saved", "Applied", "Online Assessment", "Interview", "Offer", "Rejected"];

function Dashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const res = await getApplications();
        if (!cancelled) setApplications(res.data.applications);
      } catch {
        if (!cancelled) setError("Failed to load dashboard data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusCounts = useMemo(() => {
    return statuses.reduce((counts, status) => {
      counts[status] = applications.filter((app) => app.status === status).length;
      return counts;
    }, {});
  }, [applications]);

  const upcomingDeadlines = applications
    .filter((app) => app.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>InternFlow</h1>
          <p>Welcome, {user?.name}. Track your internship progress here.</p>
        </div>
        <button type="button" className="button-ghost" onClick={logout}>
          Logout
        </button>
      </header>

      {error && <div className="alert">{error}</div>}
      {isLoading && <p className="muted">Loading dashboard...</p>}

      {!isLoading && (
        <>
          <section className="dashboard-grid">
            <article>
              <span>Total applications</span>
              <strong>{applications.length}</strong>
            </article>
            <article>
              <span>Interviews</span>
              <strong>{statusCounts.Interview || 0}</strong>
            </article>
            <article>
              <span>Offers</span>
              <strong>{statusCounts.Offer || 0}</strong>
            </article>
          </section>

          <section className="status-grid">
            {statuses.map((status) => (
              <article key={status}>
                <span>{status}</span>
                <strong>{statusCounts[status] || 0}</strong>
              </article>
            ))}
          </section>

          <section className="table-card compact-card">
            <h2>Upcoming Deadlines</h2>

            {upcomingDeadlines.length === 0 ? (
              <p className="muted">No upcoming deadlines yet.</p>
            ) : (
              <ul className="deadline-list">
                {upcomingDeadlines.map((application) => (
                  <li key={application.id}>
                    <span>
                      {application.company?.name} - {application.roleTitle}
                    </span>
                    <strong>{new Date(application.deadline).toLocaleDateString()}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-actions">
            <Link className="button-link secondary" to="/applications">
              View Applications
            </Link>
            <Link className="button-link" to="/applications/new">
              + Add Application
            </Link>
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;