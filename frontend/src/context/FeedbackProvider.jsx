import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ToastViewport from "../components/ToastViewport";
import { FeedbackContext } from "./FeedbackContext";

let nextToastId = 0;

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, action, duration = 4500 }) => {
      const id = ++nextToastId;
      setToasts((current) => [
        ...current.slice(-3),
        { id, type, title, message, action },
      ]);

      if (duration > 0) {
        const timer = window.setTimeout(() => dismissToast(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismissToast]
  );

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  const value = useMemo(
    () => ({
      addToast,
      dismissToast,
      success: (message, title = "Done") =>
        addToast({ type: "success", title, message }),
      error: (message, title = "Something went wrong") =>
        addToast({ type: "error", title, message, duration: 6500 }),
      info: (message, title = "Heads up") =>
        addToast({ type: "info", title, message }),
    }),
    [addToast, dismissToast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </FeedbackContext.Provider>
  );
}
