import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  createApplication,
  getApplication,
  updateApplication,
} from "../api/applicationApi";
import {
  createCompany,
  getCompanies,
  updateCompany,
} from "../api/companyApi";
import { PRIORITIES, STATUSES, WORK_TYPES } from "../utils/status";
import { toInputDate, todayInputDate } from "../utils/dates";

const EMPTY = {
  company: "",
  roleTitle: "",
  industry: "",
  location: "",
  workType: "Remote",
  priority: "Medium",
  status: "Saved",
  jobUrl: "",
  appliedDate: "",
  deadline: "",
};

const dangerInk = "oklch(var(--st-l) 0.12 22)";

function AppFormModal({ mode, onClose, refresh, openApp }) {
  const isEdit = mode !== "new";
  const editId = isEdit ? Number(mode) : null;

  const [form, setForm] = useState(EMPTY);
  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const companiesRes = await getCompanies();
        if (!cancelled) setCompanies(companiesRes.data.companies || []);

        if (isEdit) {
          const res = await getApplication(editId);
          if (cancelled) return;
          const a = res.data.application;
          setForm({
            company: a.company?.name || "",
            roleTitle: a.roleTitle || "",
            industry: a.company?.industry || "",
            location: a.location || "",
            workType: a.workType || "Remote",
            priority: a.priority || "Medium",
            status: a.status || "Saved",
            jobUrl: a.jobUrl || "",
            appliedDate: toInputDate(a.appliedDate),
            deadline: toInputDate(a.deadline),
          });
        }
      } catch {
        if (!cancelled) setServerError("Failed to load form data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editId]);

  const resolveCompanyId = async () => {
    const name = form.company.trim();
    const industry = form.industry.trim();
    const existing = companies.find(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (industry && !existing.industry) {
        await updateCompany(existing.id, {
          name: existing.name,
          website: existing.website,
          industry,
          location: existing.location,
        });
      }
      return existing.id;
    }

    const res = await createCompany({ name, industry: industry || undefined });
    return res.data.company.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.company.trim()) errs.company = "Required";
    if (!form.roleTitle.trim()) errs.roleTitle = "Required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setServerError("");

    try {
      const companyId = await resolveCompanyId();

      let appliedDate = form.appliedDate || null;
      if (!isEdit && form.status !== "Saved" && !appliedDate) {
        appliedDate = todayInputDate();
      }

      const payload = {
        companyId,
        roleTitle: form.roleTitle.trim(),
        jobUrl: form.jobUrl.trim() || null,
        location: form.location.trim() || null,
        workType: form.workType,
        priority: form.priority,
        status: form.status,
        appliedDate,
        deadline: form.deadline || null,
      };

      if (isEdit) {
        await updateApplication(editId, payload);
        refresh();
        onClose();
      } else {
        const res = await createApplication(payload);
        refresh();
        const newId = res.data.application.id;
        openApp(newId);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to save application"
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit}>
        <header
          style={{
            padding: "22px 26px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 className="serif" style={{ fontSize: 24, fontStyle: "italic" }}>
            {isEdit ? "Edit application" : "New application"}
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div style={{ padding: "18px 26px 26px" }}>
          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading…</p>
          ) : (
            <>
              {serverError && (
                <p style={{ color: dangerInk, fontSize: 13, marginBottom: 14 }}>
                  {serverError}
                </p>
              )}
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Company *</label>
                  <input
                    className="input"
                    value={form.company}
                    onChange={set("company")}
                    placeholder="Acme Corp"
                    list="company-options"
                  />
                  <datalist id="company-options">
                    {companies.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                  {errors.company && (
                    <span style={{ color: dangerInk, fontSize: 12 }}>
                      {errors.company}
                    </span>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Role title *</label>
                  <input
                    className="input"
                    value={form.roleTitle}
                    onChange={set("roleTitle")}
                    placeholder="Software Engineer Intern"
                  />
                  {errors.roleTitle && (
                    <span style={{ color: dangerInk, fontSize: 12 }}>
                      {errors.roleTitle}
                    </span>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Industry</label>
                  <input
                    className="input"
                    value={form.industry}
                    onChange={set("industry")}
                    placeholder="Fintech"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Location</label>
                  <input
                    className="input"
                    value={form.location}
                    onChange={set("location")}
                    placeholder="New York, NY"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Work type</label>
                  <select
                    className="select"
                    value={form.workType}
                    onChange={set("workType")}
                  >
                    {WORK_TYPES.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Priority</label>
                  <select
                    className="select"
                    value={form.priority}
                    onChange={set("priority")}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Status</label>
                  <select
                    className="select"
                    value={form.status}
                    onChange={set("status")}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Job URL</label>
                  <input
                    className="input"
                    value={form.jobUrl}
                    onChange={set("jobUrl")}
                    placeholder="https://…"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Applied date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.appliedDate}
                    onChange={set("appliedDate")}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Deadline</label>
                  <input
                    className="input"
                    type="date"
                    value={form.deadline}
                    onChange={set("deadline")}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : isEdit
                    ? "Save changes"
                    : "Add application"}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default AppFormModal;
