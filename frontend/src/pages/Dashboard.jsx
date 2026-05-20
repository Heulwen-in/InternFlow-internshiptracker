import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications } from "../api/applicationApi";
import { useAuth } from "../context/useAuth";

function Dashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const loadApplications = async () => {
      const res = await getApplications();
      setApplications(res.data.applications);
    };

    loadApplications();
  }, []);

  const interviews = applications.filter((app) => app.status === "Interview").length;
  const offers = applications.filter((app) => app.status === "Offer").length;

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

      <section className="dashboard-grid">
        <article>
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </article>
        <article>
          <span>Interviews</span>
          <strong>{interviews}</strong>
        </article>
        <article>
          <span>Offers</span>
          <strong>{offers}</strong>
        </article>
      </section>

      <section className="dashboard-actions">
        <Link className="button-link secondary" to="/applications">
          View Applications
        </Link>
        <Link className="button-link" to="/applications/new">
          + Add Application
        </Link>
      </section>
    </main>
  );
}

export default Dashboard;