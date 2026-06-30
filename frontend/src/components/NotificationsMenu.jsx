import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/reminderApi";
import { useUI } from "../context/UIContext";

function NotificationsMenu() {
  const { refreshKey, openApp } = useUI();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getNotifications();
      if (cancelled) return;
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((cur) =>
      cur.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
    );
  };

  const handleOpenNotification = async (item) => {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((cur) =>
        cur.map((notice) =>
          notice.id === item.id
            ? { ...notice, readAt: notice.readAt || new Date().toISOString() }
            : notice
        )
      );
    }

    setOpen(false);
    if (item.application) {
      openApp(item.application.id);
    } else {
      navigate("/tasks");
    }
  };

  return (
    <div className="notif-wrap" ref={menuRef}>
      <button
        className="icon-btn notif-trigger"
        title="Notifications"
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="card notif-popover">
          <div className="notif-head">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleMarkAllRead}
              >
                Mark read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              No reminders yet. Deadlines, interviews, and overdue tasks will appear here.
            </div>
          ) : (
            <div className="notif-list">
              {notifications.slice(0, 6).map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={"notif-item" + (item.readAt ? "" : " unread")}
                  onClick={() => handleOpenNotification(item)}
                >
                  <span className="notif-dot" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.body}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
