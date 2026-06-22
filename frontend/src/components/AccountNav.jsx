import { NavLink } from "react-router-dom";
import { Settings, User } from "lucide-react";

function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Account sections">
      <NavLink
        to="/profile"
        className={({ isActive }) => "account-nav-link" + (isActive ? " active" : "")}
      >
        <User size={14} /> Profile
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) => "account-nav-link" + (isActive ? " active" : "")}
      >
        <Settings size={14} /> Settings
      </NavLink>
    </nav>
  );
}

export default AccountNav;
