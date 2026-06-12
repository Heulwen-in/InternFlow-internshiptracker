const MARKS = { High: "!!!", Medium: "!!", Low: "!" };

function PriorityMark({ priority }) {
  if (!priority) return <span className="prio">—</span>;
  return (
    <span className="prio" title={`${priority} priority`}>
      <span className="prio-marks">{MARKS[priority]}</span>
      {priority}
    </span>
  );
}

export default PriorityMark;
