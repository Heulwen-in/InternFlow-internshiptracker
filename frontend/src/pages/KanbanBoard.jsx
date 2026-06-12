import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getApplications, updateApplicationStatus } from "../api/applicationApi";
import { useUI } from "../context/UIContext";
import { STATUSES, STATUS_HUES } from "../utils/status";
import { daysUntil, relDay } from "../utils/dates";
import CompanyMark from "../components/CompanyMark";
import PriorityMark from "../components/PriorityMark";

function KanbanBoard() {
  const { refreshKey, refresh, openApp, openNew } = useUI();
  const [apps, setApps] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getApplications();
      if (!cancelled) setApps(res.data.applications || []);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const grouped = useMemo(() => {
    const g = {};
    STATUSES.forEach((s) => (g[s] = apps.filter((a) => a.status === s)));
    return g;
  }, [apps]);

  const onDrop = async (status) => {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (id == null) return;
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === status) return;
    setApps((cur) =>
      cur.map((a) => (a.id === id ? { ...a, status } : a))
    );
    try {
      await updateApplicationStatus(id, status);
      refresh();
    } catch {
      refresh();
    }
  };

  return (
    <main className="page board-page">
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <header className="page-head">
          <div>
            <h1 className="page-title">Board</h1>
            <p className="page-sub">
              Drag applications between stages — status history is recorded.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={14} /> Add application
          </button>
        </header>
      </div>

      <div className="board-rail">
        {STATUSES.map((status) => (
          <section
            key={status}
            className={"kb-col" + (overCol === status ? " over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(status);
            }}
          >
            <header className="kb-col-head">
              <span
                className="dot"
                style={{
                  background: `oklch(var(--st-l) var(--st-chroma) ${STATUS_HUES[status]})`,
                }}
              />
              <h2>{status}</h2>
              <span className="count">{grouped[status].length}</span>
            </header>
            <div className="kb-list">
              {grouped[status].length === 0 && (
                <div className="kb-empty">Drop here</div>
              )}
              {grouped[status].map((a) => (
                <article
                  key={a.id}
                  className={"kb-card" + (dragId === a.id ? " dragging" : "")}
                  draggable="true"
                  onDragStart={(e) => {
                    setDragId(a.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onClick={() => openApp(a.id)}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <CompanyMark name={a.company?.name || "?"} size={26} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.company?.name || "—"}
                      </div>
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.roleTitle}
                      </div>
                    </div>
                  </div>
                  <div className="kb-card-foot">
                    <PriorityMark priority={a.priority} />
                    {a.deadline && (
                      <span
                        className="mono-label"
                        style={{
                          fontSize: 10,
                          color:
                            daysUntil(a.deadline) <= 2
                              ? "oklch(var(--st-l) 0.12 22)"
                              : "var(--faint)",
                        }}
                      >
                        {relDay(a.deadline)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default KanbanBoard;
