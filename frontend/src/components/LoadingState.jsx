function LoadingState({ label = "Loading…", compact = false }) {
  return (
    <div
      className={`loading-state${compact ? " compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingState;
