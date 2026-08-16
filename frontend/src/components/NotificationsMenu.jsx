import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/reminderApi";
import { useUI } from "../context/UIContext";
import { useFeedback } from "../context/FeedbackContext";
import { getApiErrorMessage } from "../utils/apiError";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

const POLL_INTERVAL_MS = 60_000;
const FOCUS_STALE_MS = 15_000;

function NotificationsMenu() {
  const { refreshKey, openApp } = useUI();
  const feedback = useFeedback();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastFetchedAtRef = useRef(0);
  const pollingDisabledRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadNotifications = useCallback(async ({ force = false } = {}) => {
    if (
      inFlightRef.current ||
      pollingDisabledRef.current ||
      (!force && document.visibilityState !== "visible")
    ) {
      return;
    }

    inFlightRef.current = true;
    try {
      const res = await getNotifications();
      if (!mountedRef.current) return;
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      setLoadError("");
      lastFetchedAtRef.current = Date.now();
    } catch (error) {
      if (!mountedRef.current) return;
      if (error?.response?.status === 401) pollingDisabledRef.current = true;
      setLoadError(getApiErrorMessage(error, "Failed to refresh notifications"));
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const initialLoad = window.setTimeout(
      () => loadNotifications({ force: true }),
      0
    );

    const refreshIfStale = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetchedAtRef.current >= FOCUS_STALE_MS
      ) {
        loadNotifications({ force: true });
      }
    };

    const interval = window.setInterval(
      () => loadNotifications(),
      POLL_INTERVAL_MS
    );
    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", refreshIfStale);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [loadNotifications, refreshKey]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleMarkAllRead = async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    setUnreadCount(0);
    setNotifications((cur) =>
      cur.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
    );
    try {
      await markAllNotificationsRead();
    } catch (error) {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      feedback.error(getApiErrorMessage(error, "Failed to mark notifications read"));
    }
  };

  const handleOpenNotification = async (item) => {
    if (!item.readAt) {
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((cur) =>
        cur.map((notice) =>
          notice.id === item.id
            ? { ...notice, readAt: notice.readAt || new Date().toISOString() }
            : notice
        )
      );
      try {
        await markNotificationRead(item.id);
      } catch (error) {
        setUnreadCount((count) => count + 1);
        setNotifications((cur) =>
          cur.map((notice) =>
            notice.id === item.id ? { ...notice, readAt: null } : notice
          )
        );
        feedback.error(getApiErrorMessage(error, "Failed to update notification"));
        return;
      }
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

          {loading ? (
            <LoadingState label="Loading notifications…" compact />
          ) : loadError ? (
            <ErrorState
              title="Notifications unavailable"
              message={loadError}
              onRetry={() => {
                pollingDisabledRef.current = false;
                setLoading(true);
                loadNotifications({ force: true });
              }}
              compact
            />
          ) : notifications.length === 0 ? (
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
