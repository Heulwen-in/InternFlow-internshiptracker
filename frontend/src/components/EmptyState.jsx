function EmptyState({ title, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
      <div
        className="serif"
        style={{
          fontSize: 22,
          fontStyle: "italic",
          marginBottom: 6,
          color: "var(--ink-2)",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13.5 }}>{hint}</div>
    </div>
  );
}

export default EmptyState;
