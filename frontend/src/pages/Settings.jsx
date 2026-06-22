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
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useSettings } from "../context/SettingsContext";
import AccountNav from "../components/AccountNav";
import PasswordInput from "../components/PasswordInput";
import {
  ACCENT_OPTIONS,
  reorderWeekdays,
} from "../utils/settingsDefaults";
import {
  changePassword,
  deleteAccount,
  getPreferences,
  updatePreferences,
} from "../api/profileApi";
import { getApplications } from "../api/applicationApi";
import { getTasks } from "../api/taskApi";
import api from "../api/axios";

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

  const handleExport = async () => {
    setExportBusy(true);
    setExportMsg("");
    try {
      const [appsRes, tasksRes, companiesRes] = await Promise.all([
        getApplications(),
        getTasks(),
        api.get("/companies"),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        applications: appsRes.data.applications || [],
        tasks: tasksRes.data.tasks || [],
        companies: companiesRes.data.companies || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internflow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg("Download started");
    } catch {
      setExportMsg("Export failed — try again");
    } finally {
      setExportBusy(false);
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
            <SettingRow label="Accent color" hint="Updates buttons, links, and highlights.">
              <div className="settings-accent-row">
                {ACCENT_OPTIONS.map(({ hue, label }) => (
                  <button
                    key={hue}
                    type="button"
                    className={
                      "settings-accent-swatch" +
                      (settings.accentHue === hue ? " active" : "")
                    }
                    style={{
                      background: `oklch(0.52 0.145 ${hue})`,
                    }}
                    title={label}
                    aria-label={label}
                    onClick={() => updateSettings({ accentHue: hue })}
                  />
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Density" hint="Adjust spacing across lists and cards.">
              <SettingSegment
                value={settings.density}
                options={[
                  ["compact", "Compact"],
                  ["regular", "Regular"],
                  ["comfy", "Comfy"],
                ]}
                onChange={(density) => updateSettings({ density })}
              />
            </SettingRow>
            <SettingRow label="Motion" hint="Reduce animations for accessibility.">
              <SettingSegment
                value={settings.reducedMotion}
                options={[
                  ["system", "System"],
                  ["reduce", "Reduce"],
                  ["normal", "Full"],
                ]}
                onChange={(reducedMotion) => updateSettings({ reducedMotion })}
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
                  hint="Email nudges before application deadlines (when enabled)."
                >
                  <SettingToggle
                    checked={prefs.emailDeadlineReminders}
                    label="Deadline reminders"
                    onChange={(v) => savePref({ emailDeadlineReminders: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Weekly digest"
                  hint="A Sunday summary of your pipeline and upcoming tasks."
                >
                  <SettingToggle
                    checked={prefs.emailWeeklyDigest}
                    label="Weekly digest"
                    onChange={(v) => savePref({ emailWeeklyDigest: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Product updates"
                  hint="Occasional emails about new InternFlow features."
                >
                  <SettingToggle
                    checked={prefs.productUpdates}
                    label="Product updates"
                    onChange={(v) => savePref({ productUpdates: v })}
                  />
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
              Download a JSON backup of your applications, tasks, and companies.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exportBusy}
            >
              <Download size={14} />
              {exportBusy ? "Preparing…" : "Export data"}
            </button>
            {exportMsg && <span className="profile-ok">{exportMsg}</span>}
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
              <div className="settings-preview-chip">
                Accent ·{" "}
                {ACCENT_OPTIONS.find((o) => o.hue === settings.accentHue)?.label ||
                  "Custom"}
              </div>
              <div className="settings-preview-chip">
                Density · {settings.density}
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
