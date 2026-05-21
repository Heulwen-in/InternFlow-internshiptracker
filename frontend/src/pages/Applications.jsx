import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteApplication,
  getApplications,
  updateApplication,
} from "../api/applicationApi";

const statuses = ["Saved", "Applied", "Online Assessment", "Interview", "Offer", "Rejected"];
const priorities = ["Low", "Medium", "High"];
const workTypes = ["Remote", "Hybrid", "On-site"];

function Applications() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const res = await getApplications();
        if (!cancelled) setApplications(res.data.applications);
      } catch {
        if (!cancelled) setError("Failed to load applications");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications
      .filter((application) => {
        const companyName = application.company?.name?.toLowerCase() || "";
        const roleTitle = application.roleTitle.toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          companyName.includes(normalizedSearch) ||
          roleTitle.includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "All" || application.status === statusFilter;

        const matchesPriority =
          priorityFilter === "All" || application.priority === priorityFilter;

        const matchesWorkType =
          workTypeFilter === "All" || application.workType === workTypeFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesWorkType;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return dateA - dateB;
        }

        if (sortBy === "priority") {
          const order = { High: 1, Medium: 2, Low: 3 };
          return (order[a.priority] || 4) - (order[b.priority] || 4);
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [applications, search, statusFilter, priorityFilter, workTypeFilter, sortBy]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this application?")) return;

    await deleteApplication(id);
    setApplications((current) => current.filter((app) => app.id !== id));
  };

  const handleStatusChange = async (application, status) => {
    const res = await updateApplication(application.id, { status });

    setApplications((current) =>
      current.map((item) =>
        item.id === application.id ? res.data.application : item
      )
    );
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Applications</h1>
          <p>Search, filter, and update your internship pipeline.</p>
        </div>
        <Link className="button-link" to="/applications/new">
          Add Application
        </Link>
      </header>

      <section className="filters">
        <input
          placeholder="Search company or role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option>All</option>
          {priorities.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>

        <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)}>
          <option>All</option>
          {workTypes.map((workType) => (
            <option key={workType}>{workType}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest updated</option>
          <option value="deadline">Closest deadline</option>
          <option value="priority">Highest priority</option>
        </select>
      </section>

      {error && <div className="alert">{error}</div>}
      {isLoading && <p className="muted">Loading applications...</p>}

      {!isLoading && (
        <section className="table-card">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Work Type</th>
                <th>Deadline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>{application.company?.name}</td>
                  <td>{application.roleTitle}</td>
                  <td>
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusChange(application, e.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{application.priority || "None"}</td>
                  <td>{application.workType || "None"}</td>
                  <td>
                    {application.deadline
                      ? new Date(application.deadline).toLocaleDateString()
                      : "No deadline"}
                  </td>
                  <td className="table-actions">
                    <Link to={`/applications/${application.id}/edit`}>Edit</Link>
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

              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan="7">No applications match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default Applications;