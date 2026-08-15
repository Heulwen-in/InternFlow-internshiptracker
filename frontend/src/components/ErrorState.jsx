import { AlertCircle, RotateCcw } from "lucide-react";

function ErrorState({
  title = "Couldn’t load this section",
  message = "Check your connection and try again.",
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`error-state${compact ? " compact" : ""}`}
      role="alert"
    >
      <AlertCircle size={compact ? 18 : 22} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RotateCcw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
