function CompanyMark({ name = "?", size = 34 }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: size * 0.5,
        background: `oklch(var(--st-bg-l) 0.025 ${h})`,
        color: `oklch(var(--st-l) 0.06 ${h})`,
      }}
    >
      {name[0]?.toUpperCase() || "?"}
    </span>
  );
}

export default CompanyMark;
