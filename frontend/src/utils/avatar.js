export const AVATAR_HUES = [22, 35, 45, 150, 200, 250, 280, 320];

const MAX_AVATAR_BYTES = 150 * 1024;
const MAX_DATA_URL_LENGTH = 120_000;
const AVATAR_MAX_PX = 256;

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

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function resizeToDataUrl(img, maxPx, quality) {
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function readAvatarFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be 150 KB or smaller");
  }

  const img = await loadImageFromFile(file);

  let quality = 0.88;
  let dataUrl = resizeToDataUrl(img, AVATAR_MAX_PX, quality);
  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.5) {
    quality -= 0.1;
    dataUrl = resizeToDataUrl(img, AVATAR_MAX_PX, quality);
  }

  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error("Image is too large — try a smaller photo");
  }

  return dataUrl;
}
