import { initials } from "../utils/dates";
import { avatarStyles, resolveAvatarHue } from "../utils/avatar";

function UserAvatar({ user, size = 34, className = "" }) {
  const hue = resolveAvatarHue(user);
  const label = user?.name || "User";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={label}
        className={"user-avatar user-avatar-photo" + (className ? ` ${className}` : "")}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={"user-avatar user-avatar-initials" + (className ? ` ${className}` : "")}
      style={{
        ...avatarStyles(hue, size),
        fontSize: size * 0.36,
      }}
      aria-hidden="true"
    >
      {initials(label)}
    </span>
  );
}

export default UserAvatar;
