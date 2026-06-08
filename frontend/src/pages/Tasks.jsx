import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createTask, deleteTask, getTasks, updateTask } from "../api/taskApi";
import { getApplications } from "../api/applicationApi";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    applicationId: "",
  });
  const [filter, setFilter] = useState("open");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksRes, applicationsRes] = await Promise.all([
          getTasks(),
          getApplications(),
        ]);

        setTasks(tasksRes.data.tasks);
        setApplications(applicationsRes.data.applications);
      } catch {
        setError("Failed to load tasks");
      }
    };

    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "all") {
      return tasks;
    }

    return tasks.filter((task) => !task.completed);
  }, [tasks, filter]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const res = await createTask({
        title: form.title,
        dueDate: form.dueDate || null,
        applicationId: form.applicationId ? Number(form.applicationId) : null,
      });

      setTasks((current) => [res.data.task, ...current]);
      setForm({ title: "", dueDate: "", applicationId: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const resetTaskForm = () => {
    setForm({ title: "", dueDate: "", applicationId: "" });
  };

  const handleToggleComplete = async (task) => {
    try {
      const res = await updateTask(task.id, {
        completed: !task.completed,
      });

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? res.data.task : item))
      );
    } catch {
      setError("Failed to update task");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;

    await deleteTask(id);
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  return (
    <main className="dashboard">
      <Link to="/dashboard" className="back-link">
        &lt; Back to dashboard
      </Link>

      <header className="dashboard-header">
        <div>
          <h1>Tasks</h1>
          <p>Track follow-ups, deadlines, and preparation work.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="application-stack">
        <form
          className="table-card compact-card comment-section"
          onSubmit={handleCreateTask}
        >
          <div className="comment-section__header">
            <div>
              <h2>Add Task</h2>
              <p>Create a follow-up, deadline, or preparation reminder.</p>
            </div>
          </div>

          <div className="comment-composer task-composer">
            <div className="comment-avatar" aria-hidden="true">
              T
            </div>

            <div className="task-composer-fields">
              <input
                placeholder="Add a task..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className="task-form-grid">
                <label>
                  Due date
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </label>

                <label>
                  Application
                  <select
                    value={form.applicationId}
                    onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                  >
                    <option value="">No linked application</option>
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {application.company?.name} - {application.roleTitle}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="comment-actions">
              <button type="button" className="button-ghost" onClick={resetTaskForm}>
                Cancel
              </button>
              <button type="submit" disabled={!form.title.trim()}>
                Add Task
              </button>
            </div>
          </div>
        </form>

        <section className="table-card compact-card task-board-card">
          <div className="section-header">
            <div>
              <h2>Task List</h2>
              <p className="muted">Review, complete, or remove follow-up items.</p>
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="muted">No tasks found.</p>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li className="task-item" key={task.id} data-completed={task.completed}>
                  <div>
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                      />
                      <span>{task.title}</span>
                    </label>

                    <div className="task-meta">
                      {task.dueDate && (
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      {task.application && (
                        <span>
                          {task.application.company?.name} - {task.application.roleTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="comment-item__actions">
                    <button type="button" onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

export default Tasks;
