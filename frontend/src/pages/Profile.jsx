import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Lock, User } from "lucide-react";
import { useAuth } from "../context/useAuth";
import UserAvatar from "../components/UserAvatar";
import PasswordInput from "../components/PasswordInput";
import { changePassword, getProfileStats, updateProfile } from "../api/profileApi";
import { AVATAR_HUES, avatarStyles, readAvatarFile, resolveAvatarHue } from "../utils/avatar";
import { fmtDate } from "../utils/dates";

const passwordRules = (pw) => [
  pw.length > 8,
  /\d/.test(pw),
  /[A-Z]/.test(pw),
  /[^A-Za-z0-9]/.test(pw),
];

function Profile() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [draft, setDraft] = useState({});
  const [stats, setStats] = useState(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [avatarErr, setAvatarErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    getProfileStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  const form = useMemo(
    () => ({
      name: draft.name ?? user?.name ?? "",
      bio: draft.bio ?? user?.bio ?? "",
      school: draft.school ?? user?.school ?? "",
      graduationYear:
        draft.graduationYear ??
        (user?.graduationYear ? String(user.graduationYear) : ""),
      targetRole: draft.targetRole ?? user?.targetRole ?? "",
      avatarUrl: draft.avatarUrl !== undefined ? draft.avatarUrl : user?.avatarUrl ?? null,
      avatarHue: draft.avatarHue !== undefined ? draft.avatarHue : user?.avatarHue ?? null,
    }),
    [draft, user]
  );

  const setForm = (updater) => {
    setDraft((prev) => {
      const current = {
        name: prev.name ?? user?.name ?? "",
        bio: prev.bio ?? user?.bio ?? "",
        school: prev.school ?? user?.school ?? "",
        graduationYear:
          prev.graduationYear ??
          (user?.graduationYear ? String(user.graduationYear) : ""),
        targetRole: prev.targetRole ?? user?.targetRole ?? "",
        avatarUrl:
          prev.avatarUrl !== undefined ? prev.avatarUrl : user?.avatarUrl ?? null,
        avatarHue:
          prev.avatarHue !== undefined ? prev.avatarHue : user?.avatarHue ?? null,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        name: next.name,
        bio: next.bio,
        school: next.school,
        graduationYear: next.graduationYear,
        targetRole: next.targetRole,
        avatarUrl: next.avatarUrl,
        avatarHue: next.avatarHue,
      };
    });
  };

  const previewUser = {
    ...user,
    name: form.name || user?.name,
    avatarUrl: form.avatarUrl,
    avatarHue: form.avatarHue,
  };

  const hue = resolveAvatarHue(previewUser);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarErr("");
    try {
      const dataUrl = await readAvatarFile(file);
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
    } catch (err) {
      setAvatarErr(err.message || "Could not load image");
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setBusy(true);
    try {
      const res = await updateProfile({
        name: form.name,
        bio: form.bio,
        school: form.school,
        graduationYear: form.graduationYear || null,
        targetRole: form.targetRole,
        avatarUrl: form.avatarUrl,
        avatarHue: form.avatarHue,
      });
      updateUser(res.data.user);
      setDraft({});
      setProfileMsg("Profile saved");
    } catch (err) {
      setProfileErr(err.response?.data?.message || "Failed to save profile");
    } finally {
      setBusy(false);
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

  const memberSince = user?.createdAt
    ? fmtDate(user.createdAt, { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="profile-kicker">Account</p>
          <h1 className="page-title">
            Your <em>profile</em>
          </h1>
          <p className="page-sub">Manage how you appear across InternFlow.</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-main">
          <div className="card profile-hero">
            <div className="profile-avatar-block">
              <UserAvatar user={previewUser} size={96} className="profile-avatar-lg" />
              <div className="profile-avatar-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={14} /> Upload photo
                </button>
                {form.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: null }))}
                  >
                    Remove photo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleAvatarPick}
                />
              </div>
              {avatarErr && <span className="profile-err">{avatarErr}</span>}
              {!form.avatarUrl && (
                <div className="profile-hue-row">
                  <span className="profile-hue-label">Accent color</span>
                  <div className="profile-hue-swatches">
                    {AVATAR_HUES.map((h) => (
                      <button
                        key={h}
                        type="button"
                        className={
                          "profile-hue-swatch" + (hue === h ? " active" : "")
                        }
                        style={avatarStyles(h, 28)}
                        aria-label={`Avatar color ${h}`}
                        onClick={() => setForm((f) => ({ ...f, avatarHue: h }))}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-hero-meta">
              <h2>{form.name || user?.name}</h2>
              <p>{user?.email}</p>
              {form.targetRole && <p className="profile-role">{form.targetRole}</p>}
              {form.school && (
                <p className="profile-school">
                  {form.school}
                  {form.graduationYear ? ` · Class of ${form.graduationYear}` : ""}
                </p>
              )}
            </div>
          </div>

          <form className="card profile-card" onSubmit={saveProfile}>
            <div className="card-head">
              <h3 className="card-title">Profile details</h3>
            </div>

            <div className="profile-fields">
              <div className="field">
                <label className="field-label">Display name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Maya Okafor"
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">Email</label>
                <input className="input" value={user?.email || ""} disabled />
                <span className="profile-hint">
                  Email is tied to your account and cannot be changed here.
                </span>
              </div>

              <div className="field">
                <label className="field-label">Bio</label>
                <textarea
                  className="textarea"
                  rows={3}
                  maxLength={280}
                  value={form.bio}
                  placeholder="CS student tracking summer 2026 internships…"
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                <span className="profile-hint">{form.bio.length}/280</span>
              </div>

              <div className="profile-field-row">
                <div className="field">
                  <label className="field-label">School / university</label>
                  <input
                    className="input"
                    value={form.school}
                    placeholder="State University"
                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Graduation year</label>
                  <input
                    className="input"
                    type="number"
                    min={new Date().getFullYear() - 10}
                    max={new Date().getFullYear() + 8}
                    value={form.graduationYear}
                    placeholder="2027"
                    onChange={(e) =>
                      setForm({ ...form, graduationYear: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Target role</label>
                <input
                  className="input"
                  value={form.targetRole}
                  placeholder="Software engineering intern"
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                />
              </div>
            </div>

            {profileErr && <span className="profile-err">{profileErr}</span>}
            {profileMsg && <span className="profile-ok">{profileMsg}</span>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ alignSelf: "flex-start" }}
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>

          <form className="card profile-card" onSubmit={savePassword}>
            <div className="card-head">
              <h3 className="card-title">Security</h3>
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

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwBusy}
              style={{ alignSelf: "flex-start" }}
            >
              <Lock size={14} />
              {pwBusy ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        <aside className="profile-side">
          <div className="card profile-card">
            <div className="card-head">
              <h3 className="card-title">At a glance</h3>
            </div>
            <div className="profile-stat-list">
              <div className="profile-stat">
                <span className="profile-stat-num">
                  {stats?.applications ?? "—"}
                </span>
                <span className="profile-stat-label">Applications tracked</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">{stats?.tasks ?? "—"}</span>
                <span className="profile-stat-label">Tasks created</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">
                  {stats?.completedTasks ?? "—"}
                </span>
                <span className="profile-stat-label">Tasks completed</span>
              </div>
            </div>
          </div>

          <div className="card profile-card">
            <div className="card-head">
              <h3 className="card-title">Account</h3>
            </div>
            <ul className="profile-meta-list">
              <li>
                <User size={14} />
                <span>Member since {memberSince}</span>
              </li>
              <li>
                <Check size={14} />
                <span>Email verified</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Profile;
