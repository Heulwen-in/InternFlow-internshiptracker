import { ChevronDown } from "lucide-react";

function FilterSelect({ value, onChange, label, options, noAll }) {
  const opts = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  return (
    <div className="filter-wrap">
      <select
        className="select filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {!noAll && <option value="All">All {label}</option>}
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <span className="chev">
        <ChevronDown size={13} />
      </span>
    </div>
  );
}

export default FilterSelect;
