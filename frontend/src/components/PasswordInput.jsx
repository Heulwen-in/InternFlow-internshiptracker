import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...props}
        className={"input" + (className ? ` ${className}` : "")}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        className="icon-btn password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default PasswordInput;
