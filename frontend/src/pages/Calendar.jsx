import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getApplications } from "../api/applicationApi";
import { getInterviews } from "../api/interviewApi";
import { getTasks } from "../api/taskApi";
import { useUI } from "../context/UIContext";
import { useSettings } from "../context/SettingsContext";
import { reorderWeekdays } from "../utils/settingsDefaults";
import { parseDate, fmtTime, ymd } from "../utils/dates";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getApiErrorMessage } from "../utils/apiError";

const KIND_META = {
  interview: { hue: 45, label: "Interview" },
  deadline: { hue: 22, label: "Deadline" },
  task: { hue: 250, label: "Task" },
};

function Calendar() {
  const { refreshKey, openApp } = useUI();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const DOW = reorderWeekdays(settings.weekStartsOn);

  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [appsRes, ivRes, tasksRes] = await Promise.all([
          getApplications(),
          getInterviews(),
          getTasks(),
        ]);
        if (cancelled) return;
        setApps(appsRes.data.applications || []);
        setInterviews(ivRes.data.interviews || []);
        setTasks(tasksRes.data.tasks || []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error, "Failed to load calendar events"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, retryKey]);

  const eventsByDay = useMemo(() => {
    const map = {};
    const push = (dateStr, ev) => {
      const d = parseDate(dateStr);
      if (!d) return;
      const key = ymd(d);
      (map[key] = map[key] || []).push(ev);
    };
    apps.forEach((a) => {
      if (a.deadline && !["Rejected", "Offer"].includes(a.status)) {
        push(a.deadline, {
          kind: "deadline",
          title: `${a.company?.name || "Application"} deadline`,
          app: a,
        });
      }
    });
    interviews.forEach((iv) => {
      push(iv.interviewDate, {
        kind: "interview",
        app: iv.application,
        title: `${iv.application?.company?.name || "Interview"} — ${
          iv.interviewType || "Interview"
        }`,
        time: fmtTime(iv.interviewDate),
      });
    });
    tasks.forEach((t) => {
      if (t.dueDate && !t.completed) {
        push(t.dueDate, {
          kind: "task",
          title: t.title,
          app: t.application || null,
          isTask: true,
        });
      }
    });
    const order = { interview: 0, deadline: 1, task: 2 };
    Object.values(map).forEach((list) =>
      list.sort((a, b) => order[a.kind] - order[b.kind])
    );
    return map;
  }, [apps, interviews, tasks]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayKey = ymd(new Date());

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    const startOffset = (first.getDay() - settings.weekStartsOn + 7) % 7;
    start.setDate(first.getDate() - startOffset);
    const out = [];
    const d = new Date(start);
    while (out.length < 42) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
      if (
        out.length % 7 === 0 &&
        d.getMonth() !== cursor.getMonth() &&
        d > first &&
        out.length >= 35
      )
        break;
    }
    return out;
  }, [cursor, settings.weekStartsOn]);

  const monthEventCount = cells.reduce(
    (n, d) =>
      d.getMonth() === cursor.getMonth()
        ? n + (eventsByDay[ymd(d)] || []).length
        : n,
    0
  );

  const shift = (n) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  const goEvent = (ev) => (ev?.app ? openApp(ev.app.id) : navigate("/tasks"));

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-sub">
            {monthEventCount} {monthEventCount === 1 ? "item" : "items"} this month —
            deadlines, interviews &amp; task due dates
          </p>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
        >
          <div className="cal-legend">
            {Object.entries(KIND_META).map(([k, m]) => (
              <span key={k}>
                <i
                  style={{
                    background: `oklch(var(--st-l) var(--st-chroma) ${m.hue})`,
                  }}
                />
                {m.label}s
              </span>
            ))}
          </div>
          <div className="cal-head-controls">
            <button
              className="icon-btn"
              onClick={() => shift(-1)}
              aria-label="Previous month"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="cal-month">{monthLabel}</span>
            <button
              className="icon-btn"
              onClick={() => shift(1)}
              aria-label="Next month"
            >
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 6 }}
              onClick={() => {
                const now = new Date();
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Today
            </button>
          </div>
        </div>
      </header>

      {loadError ? (
        <ErrorState
          message={loadError}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      ) : loading ? (
        <div className="card">
          <LoadingState label="Loading calendar…" />
        </div>
      ) : (
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="cal-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const key = ymd(d);
            const evs = eventsByDay[key] || [];
            const isDim = d.getMonth() !== cursor.getMonth();
            const shown = evs.slice(0, 3);
            return (
              <div
                key={i}
                className={
                  "cal-cell" +
                  (isDim ? " dim" : "") +
                  (key === todayKey ? " today" : "")
                }
              >
                <span className="cal-daynum">{d.getDate()}</span>
                {shown.map((ev, j) => {
                  const m = KIND_META[ev.kind];
                  return (
                    <button
                      key={j}
                      className="cal-ev"
                      title={ev.title}
                      style={{
                        background: `oklch(var(--st-bg-l) var(--st-bg-c) ${m.hue})`,
                        color: `oklch(var(--st-l) var(--st-chroma) ${m.hue})`,
                      }}
                      onClick={() => goEvent(ev)}
                    >
                      <span className="evdot" />
                      <span className="tx">{ev.title}</span>
                      {ev.time && <span className="tm">{ev.time}</span>}
                    </button>
                  );
                })}
                {evs.length > 3 && (
                  <button className="cal-more" onClick={() => goEvent(evs[3])}>
                    +{evs.length - 3} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </main>
  );
}

export default Calendar;
