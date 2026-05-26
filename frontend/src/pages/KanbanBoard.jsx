import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApplications, updateApplicationStatus } from "../api/applicationApi";

const statuses = ["Saved", "Applied", "Online Assessment", "Interview", "Offer", "Rejected"];

function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await getApplications();
        setApplications(res.data.applications);
      } catch {
        setError("Failed to load kanban board");
      }
    };

    loadApplications();
  }, []);

  const groupedApplications = useMemo(() => {
    return statuses.reduce((groups, status) => {
      groups[status] = applications.filter((application) => application.status === status);
      return groups;
    }, {});
  }, [applications]);

  const handleMove = async (application, nextStatus) => {
    try {
      const res = await updateApplicationStatus(application.id, nextStatus);

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? res.data.application : item
        )
      );
    } catch {
      setError("Failed to update application status");
    }
  };

  return (
    <main className="dashboard">
      <Link to="/applications" className="back-link">
        &lt; Back to applications
      </Link>

      <header className="dashboard-header">
        <div>
          <h1>Kanban Board</h1>
          <p>Move applications through your internship pipeline.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="kanban-board">
        {statuses.map((status) => (
          <article className="kanban-column" key={status}>
            <header>
              <h2>{status}</h2>
              <span>{groupedApplications[status]?.length || 0}</span>
            </header>

            <div className="kanban-list">
              {groupedApplications[status]?.map((application) => (
                <div className="kanban-card" key={application.id}>
                  <strong>{application.roleTitle}</strong>
                  <span>{application.company?.name}</span>

                  <select
                    value={application.status}
                    onChange={(e) => handleMove(application, e.target.value)}
                  >
                    {statuses.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}

              {groupedApplications[status]?.length === 0 && (
                <p className="muted">No applications</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default KanbanBoard;