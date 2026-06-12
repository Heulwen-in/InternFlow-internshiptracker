import { Check } from "lucide-react";

function TaskCheck({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      style={{
        width: 19,
        height: 19,
        borderRadius: 6,
        flex: "none",
        border: checked ? "1px solid var(--accent)" : "1px solid var(--line-strong)",
        background: checked ? "var(--accent)" : "transparent",
        color: "var(--accent-ink)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        padding: 0,
      }}
    >
      {checked && <Check size={12} strokeWidth={2.5} />}
    </button>
  );
}

export default TaskCheck;
