import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createTask, deleteTask, getTasks, updateTask } from "../api/taskApi";
import { getApplications } from "../api/applicationApi";
import { useUI } from "../context/UIContext";
import { daysUntil, relDay } from "../utils/dates";
import TaskCheck from "../components/TaskCheck";
import EmptyState from "../components/EmptyState";

const dangerInk = "oklch(var(--st-l) 0.12 22)";

function Tasks() {
  const { refreshKey, refresh, openApp } = useUI();
  const [tasks, setTasks] = useState([]);
  const [apps, setApps] = useState([]);
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState("");
  const [linkId, setLinkId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [tasksRes, appsRes] = await Promise.all([
        getTasks(),
        getApplications(),
      ]);
      if (cancelled) return;
      setTasks(tasksRes.data.tasks || []);
      setApps(appsRes.data.applications || []);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const overdue = open.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0);
  const today = open.filter((t) => t.dueDate && daysUntil(t.dueDate) === 0);
  const upcoming = open
    .filter((t) => !t.dueDate || daysUntil(t.dueDate) > 0)
    .sort(
      (a, b) =>
        (a.dueDate ? new Date(a.dueDate) : Infinity) -
        (b.dueDate ? new Date(b.dueDate) : Infinity)
    );

  const groups = [
    ["Overdue", overdue, dangerInk],
    ["Today", today, "var(--accent)"],
    ["Upcoming", upcoming, null],
    ["Done", done, null],
  ];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const res = await createTask({
      title: draft.trim(),
      dueDate: due || null,
      applicationId: linkId ? Number(linkId) : null,
    });
    setTasks((cur) => [res.data.task, ...cur]);
    setDraft("");
    setDue("");
    setLinkId("");
    refresh();
  };

  const handleToggle = async (task) => {
    const res = await updateTask(task.id, { completed: !task.completed });
    setTasks((cur) => cur.map((t) => (t.id === task.id ? res.data.task : t)));
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks((cur) => cur.filter((t) => t.id !== id));
    refresh();
  };

  return (
    <main className="page tasks-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-sub">
            {open.length} open · follow-ups, prep, and paperwork
          </p>
        </div>
      </header>

      <form className="task-add" onSubmit={handleAdd}>
        <input
          className="input"
          style={{ flex: "1 1 240px" }}
          placeholder="Add a task — e.g. “Follow up with recruiter”"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <input
          className="input"
          type="date"
          style={{ width: 150 }}
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <select
          className="select"
          style={{ width: 190 }}
          value={linkId}
          onChange={(e) => setLinkId(e.target.value)}
        >
          <option value="">No application</option>
          {apps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.company?.name} — {a.roleTitle}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>
          <Plus size={14} /> Add
        </button>
      </form>

      {groups.map(
        ([label, list, color]) =>
          list.length > 0 && (
            <section key={label}>
              <div className="task-group-label">
                <span className="mono-label" style={color ? { color } : undefined}>
                  {label} — {list.length}
                </span>
              </div>
              <div className="card">
                {list.map((t) => (
                  <div key={t.id} className="task-row">
                    <TaskCheck
                      checked={t.completed}
                      onChange={() => handleToggle(t)}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        minWidth: 0,
                        textDecoration: t.completed ? "line-through" : "none",
                        color: t.completed ? "var(--faint)" : "inherit",
                      }}
                    >
                      {t.title}
                    </span>
                    {t.application && (
                      <button
                        type="button"
                        className="task-link"
                        onClick={() => openApp(t.application.id)}
                      >
                        {t.application.company?.name || "Application"}
                      </button>
                    )}
                    {t.dueDate && !t.completed && (
                      <span
                        className="mono-label"
                        style={{
                          fontSize: 10.5,
                          color:
                            daysUntil(t.dueDate) <= 0 ? dangerInk : "var(--faint)",
                        }}
                      >
                        {relDay(t.dueDate)}
                      </span>
                    )}
                    <button
                      type="button"
                      className="icon-btn del"
                      style={{ width: 28, height: 28 }}
                      onClick={() => handleDelete(t.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )
      )}

      {tasks.length === 0 && (
        <div className="card">
          <EmptyState
            title="No tasks yet."
            hint="Add follow-ups and prep work above."
          />
        </div>
      )}
    </main>
  );
}

export default Tasks;
