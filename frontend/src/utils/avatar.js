export const AVATAR_HUES = [22, 35, 45, 150, 200, 250, 280, 320];

export function nameHue(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function resolveAvatarHue(user) {
  if (user?.avatarHue != null) return user.avatarHue;
  return nameHue(user?.name || "");
}

export function avatarStyles(hue, size) {
  return {
    width: size,
    height: size,
    background: `oklch(var(--st-bg-l) 0.06 ${hue})`,
    color: `oklch(var(--st-l) 0.08 ${hue})`,
    border: `1px solid oklch(var(--st-l) 0.04 ${hue})`,
  };
}

export async function readAvatarFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image");
  }
  if (file.size > 150 * 1024) {
    throw new Error("Image must be 150 KB or smaller");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });

  if (typeof dataUrl !== "string" || dataUrl.length > 200_000) {
    throw new Error("Image is too large after encoding");
  }

  return dataUrl;
}
