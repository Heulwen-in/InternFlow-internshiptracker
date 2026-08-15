import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            className={`toast toast-${toast.type}`}
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <Icon className="toast-icon" size={18} aria-hidden="true" />
            <div className="toast-copy">
              {toast.title && <strong>{toast.title}</strong>}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className="icon-btn toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastViewport;
