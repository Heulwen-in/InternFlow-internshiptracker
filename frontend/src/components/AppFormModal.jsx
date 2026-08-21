import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
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
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import { useFeedback } from "../context/FeedbackContext";
import { getApiErrorMessage } from "../utils/apiError";
import { parseJobDescription } from "../api/aiApi";

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
const PARSED_FIELD_LABELS = {
  company: "Company",
  roleTitle: "Role title",
  industry: "Industry",
  location: "Location",
  workType: "Work type",
  deadline: "Deadline",
};

function AppFormModal({ mode, onClose, refresh, openApp }) {
  const feedback = useFeedback();
  const isEdit = mode !== "new";
  const editId = isEdit ? Number(mode) : null;

  const [form, setForm] = useState(EMPTY);
  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [parserOpen, setParserOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedSuggestions, setParsedSuggestions] = useState(null);

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
      setLoading(isEdit);
      setLoadError("");
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
      } catch (error) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error, "Failed to load form data"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editId, retryKey]);

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

  const handleParse = async () => {
    if (!jobDescription.trim()) {
      setParseError("Paste a job description first.");
      return;
    }

    setParsing(true);
    setParseError("");
    setParsedSuggestions(null);
    try {
      const response = await parseJobDescription(jobDescription.trim());
      setParsedSuggestions(response.data.parsed);
    } catch (error) {
      setParseError(getApiErrorMessage(error, "Failed to parse job description"));
    } finally {
      setParsing(false);
    }
  };

  const handleApplySuggestions = () => {
    const suggestions = parsedSuggestions || {};
    const next = { ...form };
    let appliedCount = 0;

    ["company", "roleTitle", "industry", "location", "deadline"].forEach(
      (key) => {
        if (!form[key]?.trim() && suggestions[key]) {
          next[key] = suggestions[key];
          appliedCount += 1;
        }
      }
    );
    if (suggestions.workType && form.workType === EMPTY.workType) {
      next.workType = suggestions.workType;
      appliedCount += 1;
    }
    setForm(next);

    if (appliedCount > 0) {
      feedback.success(
        `${appliedCount} suggestion${appliedCount === 1 ? "" : "s"} applied`,
        "Job details added"
      );
    } else {
      feedback.info(
        "Your existing values were kept. Clear a field to apply its suggestion.",
        "No fields changed"
      );
    }
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
        feedback.success("Application updated");
        refresh();
        onClose();
      } else {
        const res = await createApplication(payload);
        feedback.success("Application added");
        refresh();
        const newId = res.data.application.id;
        openApp(newId);
      }
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save application");
      setServerError(message);
      feedback.error(message);
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
            <LoadingState label="Loading application…" compact />
          ) : loadError ? (
            <ErrorState
              message={loadError}
              onRetry={() => setRetryKey((key) => key + 1)}
              compact
            />
          ) : (
            <>
              {serverError && (
                <p style={{ color: dangerInk, fontSize: 13, marginBottom: 14 }}>
                  {serverError}
                </p>
              )}
              <section className={`job-parser${parserOpen ? " open" : ""}`}>
                <button
                  type="button"
                  className="job-parser-toggle"
                  onClick={() => setParserOpen((open) => !open)}
                  aria-expanded={parserOpen}
                >
                  <span>
                    <strong>Parse job description</strong>
                    <small>Fill application details with your local Ollama model</small>
                  </span>
                  <ChevronDown size={17} aria-hidden="true" />
                </button>
                {parserOpen && (
                  <div className="job-parser-body">
                    <label className="field">
                      <span className="field-label">Job description</span>
                      <textarea
                        className="textarea job-parser-input"
                        value={jobDescription}
                        onChange={(event) => {
                          setJobDescription(event.target.value);
                          setParseError("");
                          setParsedSuggestions(null);
                        }}
                        maxLength={30000}
                        placeholder="Paste the complete job description here…"
                        disabled={parsing}
                      />
                    </label>
                    <div className="job-parser-actions">
                      <span>{jobDescription.length.toLocaleString()} / 30,000</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleParse}
                        disabled={parsing || !jobDescription.trim()}
                      >
                        {parsing ? "Parsing…" : "Parse description"}
                      </button>
                    </div>
                    {parsing && (
                      <LoadingState label="Ollama is reading the job…" compact />
                    )}
                    {parseError && (
                      <ErrorState
                        title="Couldn’t parse this description"
                        message={parseError}
                        onRetry={handleParse}
                        compact
                      />
                    )}
                    {parsedSuggestions && !parsing && (
                      <div className="job-parser-results">
                        <div className="job-parser-results-head">
                          <div>
                            <strong>Parsed suggestions</strong>
                            <span>Existing details will not be overwritten.</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleApplySuggestions}
                          >
                            Apply suggestions
                          </button>
                        </div>
                        <dl>
                          {Object.entries(PARSED_FIELD_LABELS).map(
                            ([key, label]) => (
                              <div key={key}>
                                <dt>{label}</dt>
                                <dd>{parsedSuggestions[key] || "Not found"}</dd>
                              </div>
                            )
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                )}
              </section>
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
