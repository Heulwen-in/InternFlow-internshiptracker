import { STATUS_HUES, statusLabel } from "../utils/status";

function StatusBadge({ status }) {
  return (
    <span className="status-badge" style={{ "--st-h": STATUS_HUES[status] ?? 75 }}>
      <span className="dot" />
      {statusLabel(status)}
    </span>
  );
}

export default StatusBadge;
