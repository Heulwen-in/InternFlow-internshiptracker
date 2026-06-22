import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Briefcase,
  Grid2x2,
  MapPin,
  Plus,
  Rows3,
  Search,
  X,
} from "lucide-react";
import { getApplications } from "../api/applicationApi";
import { useUI } from "../context/UIContext";
import { useSettings } from "../context/SettingsContext";
import { PRIORITIES, STATUSES, WORK_TYPES } from "../utils/status";
import { daysUntil, fmtDate, relDay } from "../utils/dates";
import StatusBadge from "../components/StatusBadge";
import PriorityMark from "../components/PriorityMark";
import CompanyMark from "../components/CompanyMark";
import FilterSelect from "../components/FilterSelect";
import EmptyState from "../components/EmptyState";

function deadlineColor(deadline) {
  const d = daysUntil(deadline);
  if (d === null) return "var(--faint)";
  if (d <= 1) return "oklch(var(--st-l) 0.12 22)";
  if (d <= 4) return "oklch(var(--st-l) 0.1 45)";
  return "var(--muted)";
}

function Applications() {
  const { refreshKey, openApp, openNew } = useUI();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "All"
  );
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState(
    () => localStorage.getItem("internflow-apps-view") || settings.defaultAppsView
  );

  useEffect(() => {
    localStorage.setItem("internflow-apps-view", view);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getApplications();
        if (!cancelled) setApps(res.data.applications || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps
      .filter((a) => {
        const company = a.company?.name?.toLowerCase() || "";
        const role = a.roleTitle?.toLowerCase() || "";
        const okQ = !q || company.includes(q) || role.includes(q);
        const okS = statusFilter === "All" || a.status === statusFilter;
        const okP = priorityFilter === "All" || a.priority === priorityFilter;
        const okW = workTypeFilter === "All" || a.workType === workTypeFilter;
        return okQ && okS && okP && okW;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          const da = a.deadline ? new Date(a.deadline) : Infinity;
          const db = b.deadline ? new Date(b.deadline) : Infinity;
          return da - db;
        }
        if (sortBy === "priority") {
          const o = { High: 1, Medium: 2, Low: 3 };
          return (o[a.priority] || 4) - (o[b.priority] || 4);
        }
        if (sortBy === "company")
          return (a.company?.name || "").localeCompare(b.company?.name || "");
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [apps, search, statusFilter, priorityFilter, workTypeFilter, sortBy]);

  const filterCount = [statusFilter, priorityFilter, workTypeFilter].filter(
    (f) => f !== "All"
  ).length;

  const clearFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setWorkTypeFilter("All");
    if (searchParams.get("status")) {
      const next = new URLSearchParams(searchParams);
      next.delete("status");
      setSearchParams(next, { replace: true });
    }
  };

  const inMotion = apps.filter(
    (a) => !["Rejected", "Offer"].includes(a.status)
  ).length;

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-sub">
            {apps.length} total · {inMotion} in motion
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={14} /> Add application
        </button>
      </header>

      <div className="apps-toolbar">
        <div className="apps-search">
          <span className="search-icon">
            <Search size={15} />
          </span>
          <input
            className="input"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="status"
          options={STATUSES}
        />
        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          label="priority"
          options={PRIORITIES}
        />
        <FilterSelect
          value={workTypeFilter}
          onChange={setWorkTypeFilter}
          label="work type"
          options={WORK_TYPES}
        />
        <FilterSelect
          value={sortBy}
          onChange={setSortBy}
          label="sort"
          noAll
          options={[
            ["newest", "Newest first"],
            ["deadline", "By deadline"],
            ["priority", "By priority"],
            ["company", "By company"],
          ]}
        />
        {filterCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            <X size={12} /> Clear
          </button>
        )}
        <div className="view-toggle">
          <button
            className={view === "table" ? "on" : ""}
            onClick={() => setView("table")}
          >
            <Rows3 size={14} /> Table
          </button>
          <button
            className={view === "cards" ? "on" : ""}
            onClick={() => setView("cards")}
          >
            <Grid2x2 size={14} /> Cards
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
          Loading applications…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No applications match."
            hint="Try clearing a filter, or add a new application."
          />
        </div>
      ) : view === "table" ? (
        <div className="card table-wrap">
          <table className="apps">
            <thead>
              <tr>
                <th>Company / Role</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Work</th>
                <th>Location</th>
                <th>Applied</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => openApp(a.id)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CompanyMark name={a.company?.name || "?"} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {a.company?.name || "—"}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                          {a.roleTitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <PriorityMark priority={a.priority} />
                  </td>
                  <td style={{ color: "var(--ink-2)", fontSize: 13 }}>
                    {a.workType || "—"}
                  </td>
                  <td style={{ color: "var(--ink-2)", fontSize: 13 }}>
                    {a.location || "—"}
                  </td>
                  <td className="deadline-chip" style={{ color: "var(--muted)" }}>
                    {a.appliedDate ? fmtDate(a.appliedDate) : "—"}
                  </td>
                  <td
                    className="deadline-chip"
                    style={{ color: deadlineColor(a.deadline) }}
                  >
                    {a.deadline ? relDay(a.deadline) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="app-cards">
          {filtered.map((a) => (
            <article
              key={a.id}
              className="card app-card"
              onClick={() => openApp(a.id)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CompanyMark name={a.company?.name || "?"} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {a.company?.name || "—"}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {a.roleTitle}
                  </div>
                </div>
                <PriorityMark priority={a.priority} />
              </div>
              <div className="app-card-meta">
                {a.location && (
                  <span>
                    <MapPin size={12} />
                    {a.location}
                  </span>
                )}
                {a.workType && (
                  <span>
                    <Briefcase size={12} />
                    {a.workType}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--line)",
                  paddingTop: 12,
                  marginTop: "auto",
                }}
              >
                <StatusBadge status={a.status} />
                <span
                  className="deadline-chip"
                  style={{ color: deadlineColor(a.deadline) }}
                >
                  {a.deadline
                    ? `due ${relDay(a.deadline)}`
                    : a.appliedDate
                    ? `applied ${fmtDate(a.appliedDate)}`
                    : "not applied"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Applications;
