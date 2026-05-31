import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications } from "../api/applicationApi";
import { useAuth } from "../context/useAuth";
import { getTasks } from "../api/taskApi";
import { getInterviews } from "../api/interviewApi";

const statuses = ["Saved", "Applied", "Online Assessment", "Interview", "Offer", "Rejected"];

function Dashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const [applicationsRes, tasksRes, interviewsRes] = await Promise.all([
          getApplications(),
          getTasks(),
          getInterviews(),
        ]);

        if (!cancelled) {
          setApplications(applicationsRes.data.applications);
          setTasks(tasksRes.data.tasks);
          setInterviews(interviewsRes.data.interviews);
        }
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

  const openTasks = tasks.filter((task) => !task.completed).length;
  const completedTasks = tasks.filter((task) => task.completed).length;

  const upcomingDeadlines = applications
    .filter((app) => app.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const upcomingInterviews = interviews
    .filter((interview) => interview.interviewDate)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
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
            <article>
              <span>Open Tasks</span>
              <strong>{openTasks}</strong>
            </article>
            <article>
              <span>Completed Tasks</span>
              <strong>{completedTasks}</strong>
            </article>
            <article>
              <span>Upcoming interviews</span>
              <strong>{upcomingInterviews.length}</strong>
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

          <section className="table-card compact-card">
            <h2>Upcoming Tasks</h2>

            {upcomingTasks.length === 0 ? (
              <p className="muted">No upcoming tasks yet.</p>
            ) : (
              <ul className="task-list">
                {upcomingTasks.map((task) => (
                  <li key={task.id}>
                    <span>{task.title}</span>
                    <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                    </li>
                ))}
              </ul>
            )}
          </section>

          <section className="table-card compact-card">
            <h2>Upcoming Interviews</h2>
            
            {upcomingInterviews.length === 0 ? (
              <p className="muted">No upcoming interviews yet.</p>
            ) : (
            <ul className="deadline-list">
              {upcomingInterviews.map((interview) => (
                <li key={interview.id}>
                  <span>
                    {interview.application?.company?.name} - {interview.application?.roleTitle}
                  </span>
                  <strong>{new Date(interview.interviewDate).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
            )}
          </section>

          <section className="dashboard-actions">
            <Link className="button-link secondary" to="/applications">
              View Applications
            </Link>
            <Link className="button-link secondary" to="/tasks">
              View Tasks
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