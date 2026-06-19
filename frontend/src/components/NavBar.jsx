import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Plus, Sun, User } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/ThemeContext";
import UserAvatar from "./UserAvatar";

const LINKS = [
  ["/dashboard", "Dashboard", true],
  ["/applications", "Applications", true],
  ["/applications/kanban", "Board", false],
  ["/calendar", "Calendar", false],
  ["/tasks", "Tasks", false],
];

function NavBar({ onQuickAdd }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        <Link to="/dashboard" className="wordmark">
          Intern<b>Flow</b>
        </Link>

        <div className="nav-links">
          {LINKS.map(([to, label, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          <button className="btn btn-primary btn-sm" onClick={onQuickAdd}>
            <Plus size={14} /> Add application
          </button>
          <button
            className="icon-btn"
            title="Toggle theme"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              className="avatar-btn"
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
            >
              <UserAvatar user={user} size={30} />
            </button>
            {menuOpen && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: 40,
                  minWidth: 200,
                  padding: 8,
                  boxShadow: "var(--shadow-pop)",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--line)",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{user?.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                    {user?.email}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                >
                  <User size={14} /> Profile
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
