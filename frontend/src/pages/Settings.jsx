import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Database,
  Download,
  Lock,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useSettings } from "../context/SettingsContext";
import AccountNav from "../components/AccountNav";
import PasswordInput from "../components/PasswordInput";
import { reorderWeekdays } from "../utils/settingsDefaults";
import {
  changePassword,
  deleteAccount,
  getPreferences,
  updatePreferences,
} from "../api/profileApi";
import {
  exportApplicationsCsv,
  exportData,
  importData,
} from "../api/dataApi";

const passwordRules = (pw) => [
  pw.length > 8,
  /\d/.test(pw),
  /[A-Z]/.test(pw),
  /[^A-Za-z0-9]/.test(pw),
];

function SettingRow({ label, hint, children }) {
  return (
    <div className="setting-row">
      <div className="setting-row-copy">
        <div className="setting-row-label">{label}</div>
        {hint && <div className="setting-row-hint">{hint}</div>}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

function SettingSegment({ value, options, onChange }) {
  return (
    <div className="setting-segment" role="group">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          className={"setting-segment-btn" + (value === val ? " active" : "")}
          onClick={() => onChange(val)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SettingToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={"setting-toggle" + (checked ? " on" : "")}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="setting-toggle-thumb" />
    </button>
  );
}

function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState(null);
  const [prefsMsg, setPrefsMsg] = useState("");
  const [prefsErr, setPrefsErr] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    getPreferences()
      .then((res) => setPrefs(res.data.preferences))
      .catch(() => setPrefs(null));
  }, []);

  const savePref = async (patch) => {
    setPrefsMsg("");
    setPrefsErr("");
    try {
      const res = await updatePreferences(patch);
      setPrefs(res.data.preferences);
      setPrefsMsg("Notification preferences saved");
    } catch (err) {
      setPrefsErr(err.response?.data?.message || "Failed to save preferences");
    }
  };

  const toggleReminderDay = (day) => {
    if (!prefs) return;
    const current = prefs.reminderDaysBefore || [0, 1, 3];
    const next = current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort((a, b) => a - b);
    savePref({ reminderDaysBefore: next.length > 0 ? next : [0] });
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    const rules = passwordRules(pwForm.newPassword);
    if (!rules.every(Boolean)) {
      setPwErr("New password must meet all requirements below");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr("New passwords do not match");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg("Password updated");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwErr(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwBusy(false);
    }
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format = "json") => {
    setExportBusy(true);
    setExportMsg("");
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        const res = await exportApplicationsCsv();
        downloadBlob(res.data, `internflow-applications-${stamp}.csv`, "text/csv");
      } else {
        const res = await exportData();
        downloadBlob(
          JSON.stringify(res.data, null, 2),
          `internflow-export-${stamp}.json`,
          "application/json"
        );
      }
      setExportMsg("Download started");
    } catch {
      setExportMsg("Export failed — try again");
    } finally {
      setExportBusy(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportMsg("");
    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const payload = isCsv ? text : JSON.parse(text);
      const res = await importData({ format: isCsv ? "csv" : "json", payload });
      const { created, skipped, tasksCreated } = res.data.summary;
      setImportMsg(
        `Imported ${created} application${created === 1 ? "" : "s"}, skipped ${skipped}, added ${tasksCreated} standalone task${tasksCreated === 1 ? "" : "s"}.`
      );
    } catch (err) {
      setImportMsg(err.response?.data?.message || "Import failed — check the file format");
    } finally {
      setImportBusy(false);
      event.target.value = "";
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteErr("");
    if (deleteConfirm !== "DELETE") {
      setDeleteErr('Type DELETE to confirm account removal');
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      logout();
      navigate("/");
    } catch (err) {
      setDeleteErr(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteBusy(false);
    }
  };

  const weekPreview = reorderWeekdays(settings.weekStartsOn).join(" · ");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="profile-kicker">Preferences</p>
          <h1 className="page-title">
            Your <em>settings</em>
          </h1>
          <p className="page-sub">
            Customize appearance, defaults, notifications, and account security.
          </p>
        </div>
      </div>

      <AccountNav />

      <div className="settings-grid">
        <div className="settings-main">
          <section className="card settings-card">
            <div className="settings-card-head">
              <Palette size={16} />
              <h2 className="card-title">Appearance</h2>
            </div>
            <SettingRow label="Theme" hint="Choose light, dark, or match your system.">
              <SettingSegment
                value={settings.themeMode}
                options={[
                  ["light", "Light"],
                  ["dark", "Dark"],
                  ["system", "System"],
                ]}
                onChange={(themeMode) => updateSettings({ themeMode })}
              />
            </SettingRow>
          </section>

          <section className="card settings-card">
            <div className="settings-card-head">
              <Monitor size={16} />
              <h2 className="card-title">Defaults</h2>
            </div>
            <SettingRow
              label="Applications view"
              hint="Default layout when opening Applications."
            >
              <SettingSegment
                value={settings.defaultAppsView}
                options={[
                  ["table", "Table"],
                  ["cards", "Cards"],
                ]}
                onChange={(defaultAppsView) => updateSettings({ defaultAppsView })}
              />
            </SettingRow>
            <SettingRow label="Calendar week" hint={`Header order: ${weekPreview}`}>
              <SettingSegment
                value={settings.weekStartsOn}
                options={[
                  [0, "Sunday"],
                  [1, "Monday"],
                ]}
                onChange={(weekStartsOn) => updateSettings({ weekStartsOn })}
              />
            </SettingRow>
            <SettingRow
              label="Confirm deletions"
              hint="Ask before deleting an application from the drawer."
            >
              <SettingToggle
                checked={settings.confirmDelete}
                label="Confirm deletions"
                onChange={(confirmDelete) => updateSettings({ confirmDelete })}
              />
            </SettingRow>
            <SettingRow
              label="Show rejected in pipeline"
              hint="Include rejected applications on the dashboard pipeline bar."
            >
              <SettingToggle
                checked={settings.showRejectedInPipeline}
                label="Show rejected in pipeline"
                onChange={(showRejectedInPipeline) =>
                  updateSettings({ showRejectedInPipeline })
                }
              />
            </SettingRow>
          </section>

          <section className="card settings-card">
            <div className="settings-card-head">
              <Bell size={16} />
              <h2 className="card-title">Notifications</h2>
            </div>
            {prefs ? (
              <>
                <SettingRow
                  label="Deadline reminders"
                  hint="Show in-app notifications before application deadlines."
                >
                  <SettingToggle
                    checked={prefs.deadlineReminders}
                    label="Deadline reminders"
                    onChange={(v) => savePref({ deadlineReminders: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Reminder timing"
                  hint="Choose when deadlines, tasks, and interviews appear in the notification menu."
                >
                  <div className="settings-chip-row">
                    {[0, 1, 3, 7].map((day) => (
                      <button
                        type="button"
                        key={day}
                        className={
                          "settings-chip" +
                          ((prefs.reminderDaysBefore || []).includes(day) ? " active" : "")
                        }
                        onClick={() => toggleReminderDay(day)}
                      >
                        {day === 0 ? "Same day" : `${day}d before`}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                {prefsMsg && <span className="profile-ok">{prefsMsg}</span>}
                {prefsErr && <span className="profile-err">{prefsErr}</span>}
              </>
            ) : (
              <p className="setting-row-hint">Loading notification preferences…</p>
            )}
          </section>

          <form className="card settings-card" onSubmit={savePassword}>
            <div className="settings-card-head">
              <Lock size={16} />
              <h2 className="card-title">Security</h2>
            </div>
            <div className="profile-fields">
              <div className="field">
                <label className="field-label">Current password</label>
                <PasswordInput
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">New password</label>
                <PasswordInput
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <ul className="password-rules" aria-label="Password requirements">
                {[
                  "More than 8 characters",
                  "At least one number",
                  "At least one capital letter",
                  "At least one special character",
                ].map((label, i) => (
                  <li key={label} data-valid={passwordRules(pwForm.newPassword)[i]}>
                    <span aria-hidden="true">
                      {passwordRules(pwForm.newPassword)[i] ? "✓" : "○"}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="field">
                <label className="field-label">Confirm new password</label>
                <PasswordInput
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            {pwErr && <span className="profile-err">{pwErr}</span>}
            {pwMsg && <span className="profile-ok">{pwMsg}</span>}
            <button type="submit" className="btn btn-primary" disabled={pwBusy}>
              {pwBusy ? "Updating…" : "Update password"}
            </button>
          </form>

          <section className="card settings-card">
            <div className="settings-card-head">
              <Database size={16} />
              <h2 className="card-title">Your data</h2>
            </div>
            <p className="setting-row-hint">
              Download a complete JSON backup, export applications as CSV, or import
              a previous InternFlow backup/spreadsheet.
            </p>
            <div className="settings-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("json")}
                disabled={exportBusy}
              >
                <Download size={14} />
                {exportBusy ? "Preparing…" : "Export JSON"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("csv")}
                disabled={exportBusy}
              >
                <Download size={14} />
                Export CSV
              </button>
              <label className="btn btn-ghost">
                <Upload size={14} />
                {importBusy ? "Importing…" : "Import file"}
                <input
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  onChange={handleImport}
                  disabled={importBusy}
                  hidden
                />
              </label>
            </div>
            {exportMsg && <span className="profile-ok">{exportMsg}</span>}
            {importMsg && <span className="profile-ok">{importMsg}</span>}
          </section>

          <form className="card settings-card settings-danger" onSubmit={handleDeleteAccount}>
            <div className="settings-card-head">
              <Trash2 size={16} />
              <h2 className="card-title">Danger zone</h2>
            </div>
            <p className="setting-row-hint">
              Permanently delete your account and all associated data. This cannot be
              undone.
            </p>
            <div className="profile-fields">
              <div className="field">
                <label className="field-label">Confirm with your password</label>
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  className="input"
                  value={deleteConfirm}
                  placeholder="DELETE"
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            {deleteErr && <span className="profile-err">{deleteErr}</span>}
            <button type="submit" className="btn btn-danger" disabled={deleteBusy}>
              {deleteBusy ? "Deleting…" : "Delete my account"}
            </button>
          </form>
        </div>

        <aside className="settings-side">
          <div className="card settings-card">
            <div className="settings-card-head">
              <Sun size={16} />
              <h2 className="card-title">Preview</h2>
            </div>
            <div className="settings-preview">
              <div className="settings-preview-chip">
                {settings.themeMode === "system" ? (
                  <Monitor size={14} />
                ) : settings.themeMode === "dark" ? (
                  <Moon size={14} />
                ) : (
                  <Sun size={14} />
                )}
                {settings.themeMode === "system"
                  ? "System theme"
                  : settings.themeMode === "dark"
                  ? "Dark theme"
                  : "Light theme"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={resetSettings}
              style={{ alignSelf: "flex-start" }}
            >
              <RotateCcw size={13} /> Reset appearance & defaults
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Settings;
