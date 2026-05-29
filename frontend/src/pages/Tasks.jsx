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

      <section className="form-grid">
        <form className="auth-card" onSubmit={handleCreateTask}>
          <h2>Add Task</h2>

          <label>
            Task title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>

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

          <button type="submit">Add Task</button>
        </form>

        <section className="table-card compact-card">
          <div className="section-header">
            <h2>Task List</h2>
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
                <li key={task.id} data-completed={task.completed}>
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

                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
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