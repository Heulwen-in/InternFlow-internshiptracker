import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Flag, Video } from "lucide-react";
import { getApplications } from "../api/applicationApi";
import { getInterviews } from "../api/interviewApi";
import { getTasks, updateTask } from "../api/taskApi";
import { useAuth } from "../context/useAuth";
import { useUI } from "../context/UIContext";
import { useSettings } from "../context/SettingsContext";
import { STATUSES, STATUS_HUES, statusLabel } from "../utils/status";
import { daysUntil, fmtDateFull, relDay } from "../utils/dates";
import TaskCheck from "../components/TaskCheck";
import EmptyState from "../components/EmptyState";

const dangerInk = "oklch(var(--st-l) 0.12 22)";

const KIND_META = {
  interview: { Icon: Video, hue: 45 },
  deadline: { Icon: Flag, hue: 22 },
  task: { Icon: Check, hue: 250 },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function dateKicker() {
  const now = new Date();
  const label = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${label} — Week ${week}`;
}

function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { refreshKey, refresh, openApp } = useUI();
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [appsRes, tasksRes, ivRes] = await Promise.all([
          getApplications(),
          getTasks(),
          getInterviews(),
        ]);
        if (cancelled) return;
        setApps(appsRes.data.applications || []);
        setTasks(tasksRes.data.tasks || []);
        setInterviews(ivRes.data.interviews || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const active = apps.filter((a) => a.status !== "Rejected");
  const counts = useMemo(() => {
    const c = {};
    STATUSES.forEach((s) => (c[s] = apps.filter((a) => a.status === s).length));
    return c;
  }, [apps]);

  const openTasks = tasks.filter((t) => !t.completed);

  const agenda = useMemo(() => {
    const items = [];
    interviews.forEach((iv) => {
      const d = daysUntil(iv.interviewDate);
      if (d !== null && d >= 0) {
        items.push({
          kind: "interview",
          when: iv.interviewDate,
          app: iv.application,
          label: iv.interviewType || "Interview",
          days: d,
        });
      }
    });
    apps.forEach((a) => {
      if (!a.deadline) return;
      const d = daysUntil(a.deadline);
      if (
        (d !== null && d >= -3 && a.status === "Saved") ||
        (d !== null &&
          d >= -3 &&
          d <= 7 &&
          a.status !== "Rejected" &&
          a.status !== "Offer")
      ) {
        items.push({
          kind: "deadline",
          when: a.deadline,
          app: a,
          label: "Application deadline",
          days: d,
        });
      }
    });
    openTasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = daysUntil(t.dueDate);
      if (d !== null && d <= 7) {
        items.push({
          kind: "task",
          when: t.dueDate,
          app: t.application,
          isTask: true,
          label: t.title,
          sub: fmtDateFull(t.dueDate),
          days: d,
        });
      }
    });
    return items.sort((x, y) => x.days - y.days).slice(0, 5);
  }, [apps, interviews, openTasks]);

  const pipelineStatuses = useMemo(
    () =>
      settings.showRejectedInPipeline
        ? STATUSES
        : STATUSES.filter((s) => s !== "Rejected"),
    [settings.showRejectedInPipeline]
  );

  const totalPipeline =
    pipelineStatuses.reduce((n, s) => n + counts[s], 0) || 1;

  const handleToggleTask = async (task) => {
    setTasks((cur) =>
      cur.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    await updateTask(task.id, { completed: !task.completed });
    refresh();
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <div className="mono-label" style={{ marginBottom: 8 }}>
            {dateKicker()}
          </div>
          <h1 className="page-title">
            {greeting()}, <em style={{ color: "var(--accent)" }}>{firstName}.</em>
          </h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/applications")}>
          View pipeline <ArrowRight size={14} />
        </button>
      </header>

      <section className="stat-strip">
        <div className="stat-cell">
          <div className="mono-label">Active applications</div>
          <div className="stat-num">{active.length}</div>
        </div>
        <div className="stat-cell">
          <div className="mono-label">In interviews</div>
          <div className="stat-num">{counts.Interview}</div>
        </div>
        <div className="stat-cell">
          <div className="mono-label">Offers</div>
          <div className="stat-num" style={{ color: "oklch(var(--st-l) 0.1 155)" }}>
            {counts.Offer}
          </div>
        </div>
        <div className="stat-cell">
          <div className="mono-label">Open tasks</div>
          <div className="stat-num">{openTasks.length}</div>
        </div>
      </section>

      <div className="dash-grid">
        <section className="card">
          <div
            style={{
              padding: "16px 16px 4px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <h2 className="card-title" style={{ whiteSpace: "nowrap" }}>
              What&apos;s next
            </h2>
            <span className="mono-label">Next 7 days</span>
          </div>
          {loading ? (
            <div style={{ padding: 16, color: "var(--muted)" }}>Loading…</div>
          ) : agenda.length === 0 ? (
            <EmptyState
              title="Nothing pressing."
              hint="No deadlines, interviews, or tasks in the next week."
            />
          ) : (
            <div>
              {agenda.map((item, i) => {
                const meta = KIND_META[item.kind];
                const Ic = meta.Icon;
                return (
                  <button
                    key={i}
                    className="next-item"
                    onClick={() =>
                      item.app ? openApp(item.app.id) : navigate("/tasks")
                    }
                  >
                    <span
                      className="next-when"
                      style={{
                        color: item.days <= 0 ? dangerInk : "var(--muted)",
                        fontWeight: item.days <= 1 ? 600 : 400,
                      }}
                    >
                      {relDay(item.when)}
                    </span>
                    <span
                      className="next-icon"
                      style={{
                        background: `oklch(var(--st-bg-l) var(--st-bg-c) ${meta.hue})`,
                        color: `oklch(var(--st-l) var(--st-chroma) ${meta.hue})`,
                      }}
                    >
                      <Ic size={15} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                        {item.app
                          ? `${item.app.company?.name || "—"} · ${item.app.roleTitle}`
                          : item.sub}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--faint)" }} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <section className="card" style={{ padding: "16px 20px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <h2 className="card-title">Pipeline</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/applications/kanban")}
              >
                Board <ArrowRight size={12} />
              </button>
            </div>
            <div className="pipe-bar">
              {pipelineStatuses.map(
                (s) =>
                  counts[s] > 0 && (
                    <span
                      key={s}
                      title={`${s}: ${counts[s]}`}
                      style={{
                        flex: counts[s] / totalPipeline,
                        background: `oklch(var(--st-l) var(--st-chroma) ${STATUS_HUES[s]})`,
                        minWidth: 8,
                      }}
                    />
                  )
              )}
            </div>
            <div className="pipe-legend">
              {pipelineStatuses.map((s) => (
                <button
                  key={s}
                  className="pipe-leg"
                  onClick={() =>
                    navigate(`/applications?status=${encodeURIComponent(s)}`)
                  }
                >
                  <span
                    className="swatch"
                    style={{
                      background: `oklch(var(--st-l) var(--st-chroma) ${STATUS_HUES[s]})`,
                    }}
                  />
                  {statusLabel(s)} <b>{counts[s]}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div
              style={{
                padding: "16px 16px 6px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <h2 className="card-title">Tasks</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/tasks")}
              >
                All tasks <ArrowRight size={12} />
              </button>
            </div>
            <ul className="dash-tasks">
              {openTasks.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <TaskCheck
                    checked={t.completed}
                    onChange={() => handleToggleTask(t)}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.title}
                  </span>
                  {t.dueDate && (
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
                </li>
              ))}
              {openTasks.length === 0 && (
                <li style={{ color: "var(--muted)", fontSize: 13.5 }}>
                  All clear — nothing open.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
