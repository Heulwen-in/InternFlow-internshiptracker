import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "../api/applicationApi";
import { createNote, getNotes } from "../api/noteApi";
import {
  createInterview,
  deleteInterview,
  getApplicationInterviews,
} from "../api/interviewApi";
import { createTask, getTasks, updateTask } from "../api/taskApi";
import { useSettings } from "../context/SettingsContext";
import { STATUSES, STATUS_HUES } from "../utils/status";
import { daysUntil, fmtDateFull, fmtTime, relDay } from "../utils/dates";
import PriorityMark from "./PriorityMark";
import CompanyMark from "./CompanyMark";
import FilterSelect from "./FilterSelect";
import TaskCheck from "./TaskCheck";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import { useFeedback } from "../context/FeedbackContext";
import { getApiErrorMessage } from "../utils/apiError";

const dangerInk = "oklch(var(--st-l) 0.12 22)";

function AppDrawer({ appId, refreshKey, onClose, onEdit, refresh }) {
  const { settings } = useSettings();
  const feedback = useFeedback();
  const [app, setApp] = useState(null);
  const [notes, setNotes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState("overview");

  const [noteDraft, setNoteDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [ivFormOpen, setIvFormOpen] = useState(false);
  const [iv, setIv] = useState({ date: "", type: "", link: "", notes: "" });

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setLoadError("");
      try {
        const [appRes, notesRes, ivRes, tasksRes] = await Promise.all([
          getApplication(appId),
          getNotes(appId),
          getApplicationInterviews(appId),
          getTasks(),
        ]);
        if (cancelled) return;
        setApp(appRes.data.application);
        setNotes(notesRes.data.notes || []);
        setInterviews(ivRes.data.interviews || []);
        setTasks(
          (tasksRes.data.tasks || []).filter((t) => t.applicationId === appId)
        );
      } catch (error) {
        if (!cancelled) {
          if (error?.response?.status === 404) setNotFound(true);
          else setLoadError(getApiErrorMessage(error, "Failed to load application"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [appId, refreshKey, retryKey]);

  const reloadTasks = async () => {
    const res = await getTasks();
    setTasks((res.data.tasks || []).filter((t) => t.applicationId === appId));
  };

  const changeStatus = async (status) => {
    const previous = app;
    setApp((current) => ({ ...current, status }));
    try {
      const res = await updateApplication(appId, { status });
      setApp(res.data.application);
      feedback.success(`Status changed to ${status}`);
      refresh();
    } catch (error) {
      setApp(previous);
      feedback.error(getApiErrorMessage(error, "Failed to update status"));
    }
  };

  const handleToggleTask = async (task) => {
    const nextCompleted = !task.completed;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, completed: nextCompleted } : item
      )
    );
    try {
      await updateTask(task.id, { completed: nextCompleted });
      refresh();
    } catch (error) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed: task.completed } : item
        )
      );
      feedback.error(getApiErrorMessage(error, "Failed to update task"));
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    try {
      const res = await createNote(appId, { content: noteDraft.trim() });
      setNotes((cur) => [res.data.note, ...cur]);
      setNoteDraft("");
      feedback.success("Note saved");
    } catch (error) {
      feedback.error(getApiErrorMessage(error, "Failed to save note"));
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskDraft.trim()) return;
    try {
      await createTask({
        title: taskDraft.trim(),
        dueDate: taskDue || null,
        applicationId: appId,
      });
      setTaskDraft("");
      setTaskDue("");
      await reloadTasks();
      feedback.success("Task added");
      refresh();
    } catch (error) {
      feedback.error(getApiErrorMessage(error, "Failed to add task"));
    }
  };

  const handleAddInterview = async (e) => {
    e.preventDefault();
    if (!iv.date) return;
    try {
      await createInterview(appId, {
        interviewDate: iv.date,
        interviewType: iv.type.trim() || "Interview",
        meetingLink: iv.link.trim() || null,
        notes: iv.notes.trim() || null,
      });
      const res = await getApplicationInterviews(appId);
      setInterviews(res.data.interviews || []);
      setIv({ date: "", type: "", link: "", notes: "" });
      setIvFormOpen(false);
      feedback.success("Interview scheduled");
      refresh();
    } catch (error) {
      feedback.error(getApiErrorMessage(error, "Failed to schedule interview"));
    }
  };

  const handleDeleteInterview = async (id) => {
    const previous = interviews;
    setInterviews((cur) => cur.filter((i) => i.id !== id));
    try {
      await deleteInterview(id);
      feedback.success("Interview removed");
      refresh();
    } catch (error) {
      setInterviews(previous);
      feedback.error(getApiErrorMessage(error, "Failed to remove interview"));
    }
  };

  const handleDelete = async () => {
    if (
      settings.confirmDelete &&
      !confirm("Delete this application? Linked tasks will be kept and unlinked.")
    )
      return;
    try {
      await Promise.all(tasks.map((t) => updateTask(t.id, { applicationId: null })));
      await deleteApplication(appId);
      feedback.success("Application deleted");
      refresh();
      close();
    } catch (error) {
      feedback.error(getApiErrorMessage(error, "Failed to delete application"));
    }
  };

  const companyName = app?.company?.name || "";
  const history = app?.statusHistory || [];
  const deadlineDays = daysUntil(app?.deadline);

  const tabs = [
    ["overview", "Overview"],
    ["notes", `Notes${notes.length ? ` · ${notes.length}` : ""}`],
    ["history", "History"],
  ];

  return (
    <div>
      <div
        className={"drawer-veil" + (closing ? " closing" : "")}
        onClick={close}
      />
      <aside className={"drawer" + (closing ? " closing" : "")}>
        {loading ? (
          <LoadingState label="Loading application…" />
        ) : loadError ? (
          <div style={{ padding: 20 }}>
            <ErrorState
              message={loadError}
              onRetry={() => setRetryKey((key) => key + 1)}
              compact
            />
          </div>
        ) : notFound || !app ? (
          <div style={{ padding: 24 }}>
            <button className="icon-btn" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
            <p style={{ color: "var(--muted)", marginTop: 12 }}>
              Application not found.
            </p>
          </div>
        ) : (
          <>
            <header
              style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--line)" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                <CompanyMark name={companyName} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="serif" style={{ fontSize: 22, lineHeight: 1.15 }}>
                    {app.roleTitle}
                  </h2>
                  <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>
                    {companyName}
                    {app.company?.industry ? ` · ${app.company.industry}` : ""}
                  </div>
                </div>
                <button className="icon-btn" onClick={close} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 14,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <FilterSelect
                  noAll
                  value={app.status}
                  onChange={changeStatus}
                  label="status"
                  options={STATUSES}
                />
                <PriorityMark priority={app.priority} />
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(app.id)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-danger-ghost btn-sm"
                    onClick={handleDelete}
                    aria-label="Delete application"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </header>

            <div className="drawer-tabs">
              {tabs.map(([k, l]) => (
                <button
                  key={k}
                  className={"drawer-tab" + (tab === k ? " on" : "")}
                  onClick={() => setTab(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="drawer-body">
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div className="meta-grid">
                    <div className="meta-cell">
                      <span className="mono-label">Location</span>
                      <div>{app.location || "—"}</div>
                    </div>
                    <div className="meta-cell">
                      <span className="mono-label">Work type</span>
                      <div>{app.workType || "—"}</div>
                    </div>
                    <div className="meta-cell">
                      <span className="mono-label">Applied</span>
                      <div>
                        {app.appliedDate ? fmtDateFull(app.appliedDate) : "Not yet"}
                      </div>
                    </div>
                    <div className="meta-cell">
                      <span className="mono-label">Deadline</span>
                      <div
                        style={{
                          color:
                            deadlineDays !== null && deadlineDays <= 2
                              ? dangerInk
                              : undefined,
                        }}
                      >
                        {app.deadline
                          ? `${fmtDateFull(app.deadline)} (${relDay(app.deadline)})`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {app.jobUrl && (
                    <a
                      className="btn btn-secondary btn-sm"
                      href={
                        /^https?:\/\//.test(app.jobUrl)
                          ? app.jobUrl
                          : `https://${app.jobUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{ alignSelf: "flex-start" }}
                    >
                      <ExternalLink size={13} /> View job posting
                    </a>
                  )}

                  <section>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span className="mono-label">Interviews</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setIvFormOpen((o) => !o)}
                      >
                        {ivFormOpen ? <X size={12} /> : <Plus size={12} />}{" "}
                        {ivFormOpen ? "Cancel" : "Schedule"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ivFormOpen && (
                        <form className="iv-form" onSubmit={handleAddInterview}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                            }}
                          >
                            <div className="field">
                              <label className="field-label" style={{ fontSize: 12 }}>
                                Date &amp; time *
                              </label>
                              <input
                                className="input"
                                type="datetime-local"
                                required
                                value={iv.date}
                                onChange={(e) =>
                                  setIv({ ...iv, date: e.target.value })
                                }
                                style={{ padding: "7px 10px", fontSize: 13 }}
                              />
                            </div>
                            <div className="field">
                              <label className="field-label" style={{ fontSize: 12 }}>
                                Type
                              </label>
                              <input
                                className="input"
                                placeholder="Technical · Round 1"
                                value={iv.type}
                                onChange={(e) =>
                                  setIv({ ...iv, type: e.target.value })
                                }
                                style={{ padding: "7px 10px", fontSize: 13 }}
                              />
                            </div>
                            <div className="field">
                              <label className="field-label" style={{ fontSize: 12 }}>
                                Meeting link
                              </label>
                              <input
                                className="input"
                                placeholder="https://…"
                                value={iv.link}
                                onChange={(e) =>
                                  setIv({ ...iv, link: e.target.value })
                                }
                                style={{ padding: "7px 10px", fontSize: 13 }}
                              />
                            </div>
                            <div className="field">
                              <label className="field-label" style={{ fontSize: 12 }}>
                                Notes
                              </label>
                              <input
                                className="input"
                                placeholder="60 min, with EM"
                                value={iv.notes}
                                onChange={(e) =>
                                  setIv({ ...iv, notes: e.target.value })
                                }
                                style={{ padding: "7px 10px", fontSize: 13 }}
                              />
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            type="submit"
                            style={{ marginTop: 10, width: "100%" }}
                            disabled={!iv.date}
                          >
                            <CalendarIcon size={13} /> Schedule interview
                          </button>
                        </form>
                      )}
                      {interviews.length === 0 && !ivFormOpen && (
                        <span style={{ color: "var(--faint)", fontSize: 13 }}>
                          Nothing scheduled yet.
                        </span>
                      )}
                      {interviews
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.interviewDate) - new Date(b.interviewDate)
                        )
                        .map((interview) => (
                          <div key={interview.id} className="iv-card">
                            <span
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                flex: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "oklch(var(--st-bg-l) var(--st-bg-c) 45)",
                                color: "oklch(var(--st-l) var(--st-chroma) 45)",
                              }}
                            >
                              <Video size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                                {interview.interviewType || "Interview"}
                              </div>
                              <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                                {fmtDateFull(interview.interviewDate)} ·{" "}
                                {fmtTime(interview.interviewDate)}
                                {interview.notes ? ` — ${interview.notes}` : ""}
                              </div>
                            </div>
                            {interview.meetingLink && (
                              <a
                                className="btn btn-ghost btn-sm"
                                href={
                                  /^https?:\/\//.test(interview.meetingLink)
                                    ? interview.meetingLink
                                    : `https://${interview.meetingLink}`
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink size={12} /> Join
                              </a>
                            )}
                            <button
                              className="icon-btn iv-del"
                              style={{ width: 26, height: 26 }}
                              onClick={() => handleDeleteInterview(interview.id)}
                              aria-label="Remove interview"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </section>

                  <section>
                    <div className="mono-label" style={{ marginBottom: 10 }}>
                      Tasks
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          style={{ display: "flex", alignItems: "center", gap: 10 }}
                        >
                          <TaskCheck
                            checked={t.completed}
                            onChange={() => handleToggleTask(t)}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13.5,
                              textDecoration: t.completed ? "line-through" : "none",
                              color: t.completed ? "var(--faint)" : "inherit",
                            }}
                          >
                            {t.title}
                          </span>
                          {t.dueDate && (
                            <span className="mono-label" style={{ fontSize: 10.5 }}>
                              {relDay(t.dueDate)}
                            </span>
                          )}
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <span style={{ color: "var(--faint)", fontSize: 13 }}>
                          No tasks linked yet.
                        </span>
                      )}
                      <form
                        style={{ display: "flex", gap: 8, marginTop: 4 }}
                        onSubmit={handleAddTask}
                      >
                        <input
                          className="input"
                          style={{ flex: 1, padding: "7px 10px", fontSize: 13 }}
                          placeholder="Add a task…"
                          value={taskDraft}
                          onChange={(e) => setTaskDraft(e.target.value)}
                        />
                        <input
                          className="input"
                          type="date"
                          style={{ width: 140, padding: "7px 10px", fontSize: 13 }}
                          value={taskDue}
                          onChange={(e) => setTaskDue(e.target.value)}
                        />
                        <button className="btn btn-secondary btn-sm" type="submit">
                          <Plus size={13} />
                        </button>
                      </form>
                    </div>
                  </section>
                </div>
              )}

              {tab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <form onSubmit={handleAddNote}>
                    <textarea
                      className="textarea"
                      rows="3"
                      placeholder="Add a note — recruiter names, prep ideas, feedback…"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <button
                        className="btn btn-primary btn-sm"
                        type="submit"
                        disabled={!noteDraft.trim()}
                      >
                        Save note
                      </button>
                    </div>
                  </form>
                  {notes.map((n) => (
                    <div key={n.id} className="note-block">
                      <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{n.content}</p>
                      <div className="mono-label" style={{ fontSize: 10, marginTop: 8 }}>
                        {fmtDateFull(n.createdAt)}
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <span
                      style={{
                        color: "var(--faint)",
                        fontSize: 13,
                        textAlign: "center",
                        padding: 12,
                      }}
                    >
                      No notes yet.
                    </span>
                  )}
                </div>
              )}

              {tab === "history" && (
                <div>
                  {history.map((h, i) => (
                    <div key={h.id ?? i} className="hist-item">
                      <span
                        className="hist-dot"
                        style={{
                          background: `oklch(var(--st-l) var(--st-chroma) ${
                            STATUS_HUES[h.newStatus] ?? 75
                          })`,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                          {h.oldStatus ? (
                            <span>
                              <span style={{ color: "var(--muted)" }}>
                                {h.oldStatus}
                              </span>{" "}
                              → {h.newStatus}
                            </span>
                          ) : (
                            <span>Added as {h.newStatus}</span>
                          )}
                        </div>
                        <div className="mono-label" style={{ fontSize: 10, marginTop: 2 }}>
                          {fmtDateFull(h.changedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <span style={{ color: "var(--faint)", fontSize: 13 }}>
                      No status history yet.
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default AppDrawer;
