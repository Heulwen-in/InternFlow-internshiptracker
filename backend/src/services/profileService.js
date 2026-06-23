const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { publicUser, assertStrongPassword } = require("./authService");

const SALT_ROUNDS = 12;
const MAX_BIO = 280;
const MAX_SCHOOL = 120;
const MAX_TARGET_ROLE = 80;
const MAX_AVATAR_URL = 120_000;
const AVATAR_DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,/i;

function trimOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function validateAvatarUrl(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new HttpError(400, "Avatar must be a valid image");
  }
  if (value.length > MAX_AVATAR_URL) {
    throw new HttpError(400, "Avatar image is too large (max ~150 KB)");
  }
  if (!AVATAR_DATA_URL_RE.test(value)) {
    throw new HttpError(400, "Avatar must be a JPEG, PNG, or WebP image");
  }
  return value;
}

function validateAvatarHue(value) {
  if (value == null || value === "") return null;
  const hue = Number(value);
  if (!Number.isInteger(hue) || hue < 0 || hue > 359) {
    throw new HttpError(400, "Avatar color must be between 0 and 359");
  }
  return hue;
}

function validateGraduationYear(value) {
  if (value == null || value === "") return null;
  const year = Number(value);
  const current = new Date().getFullYear();
  if (!Number.isInteger(year) || year < current - 10 || year > current + 8) {
    throw new HttpError(400, "Graduation year is out of range");
  }
  return year;
}

async function updateProfile(userId, payload) {
  const { name, bio, school, graduationYear, targetRole, avatarUrl, avatarHue } =
    payload ?? {};

  const data = {};

  if (name !== undefined) {
    const trimmed = trimOrNull(name);
    if (!trimmed || trimmed.length < 2) {
      throw new HttpError(400, "Name must be at least 2 characters");
    }
    if (trimmed.length > 80) {
      throw new HttpError(400, "Name must be 80 characters or fewer");
    }
    data.name = trimmed;
  }

  if (bio !== undefined) {
    const trimmed = trimOrNull(bio);
    if (trimmed && trimmed.length > MAX_BIO) {
      throw new HttpError(400, `Bio must be ${MAX_BIO} characters or fewer`);
    }
    data.bio = trimmed;
  }

  if (school !== undefined) {
    const trimmed = trimOrNull(school);
    if (trimmed && trimmed.length > MAX_SCHOOL) {
      throw new HttpError(400, `School must be ${MAX_SCHOOL} characters or fewer`);
    }
    data.school = trimmed;
  }

  if (targetRole !== undefined) {
    const trimmed = trimOrNull(targetRole);
    if (trimmed && trimmed.length > MAX_TARGET_ROLE) {
      throw new HttpError(400, `Target role must be ${MAX_TARGET_ROLE} characters or fewer`);
    }
    data.targetRole = trimmed;
  }

  if (graduationYear !== undefined) {
    data.graduationYear = validateGraduationYear(graduationYear);
  }

  if (avatarUrl !== undefined) {
    data.avatarUrl = validateAvatarUrl(avatarUrl);
  }

  if (avatarHue !== undefined) {
    data.avatarHue = validateAvatarHue(avatarHue);
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No profile fields to update");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return { user: publicUser(user) };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new HttpError(400, "Current and new password are required");
  }

  assertStrongPassword(newPassword);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "Account not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new HttpError(400, "Current password is incorrect");
  }

  const same = await bcrypt.compare(newPassword, user.passwordHash);
  if (same) {
    throw new HttpError(400, "New password must be different from your current password");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: "Password updated successfully" };
}

async function getProfileStats(userId) {
  const [applications, tasks, completedTasks] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: true } }),
  ]);

  return { applications, tasks, completedTasks };
}

const DEFAULT_PREFERENCES = {
  emailDeadlineReminders: true,
  emailWeeklyDigest: false,
  productUpdates: true,
};

function normalizePreferences(raw) {
  const base = { ...DEFAULT_PREFERENCES };
  if (!raw || typeof raw !== "object") return base;
  return {
    emailDeadlineReminders: Boolean(raw.emailDeadlineReminders ?? base.emailDeadlineReminders),
    emailWeeklyDigest: Boolean(raw.emailWeeklyDigest ?? base.emailWeeklyDigest),
    productUpdates: Boolean(raw.productUpdates ?? base.productUpdates),
  };
}

async function getPreferences(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  if (!user) throw new HttpError(404, "Account not found");
  return { preferences: normalizePreferences(user.preferences) };
}

async function updatePreferences(userId, patch) {
  if (!patch || typeof patch !== "object") {
    throw new HttpError(400, "Preferences payload is required");
  }

  const current = await getPreferences(userId);
  const next = normalizePreferences({ ...current.preferences, ...patch });

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: next },
  });

  return { preferences: next };
}

async function deleteAccount(userId, password) {
  if (!password) {
    throw new HttpError(400, "Password is required to delete your account");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Account not found");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(400, "Password is incorrect");
  }

  const applicationIds = (
    await prisma.application.findMany({
      where: { userId },
      select: { id: true },
    })
  ).map((a) => a.id);

  const ops = [
    prisma.task.updateMany({ where: { userId }, data: { applicationId: null } }),
  ];

  if (applicationIds.length > 0) {
    ops.push(
      prisma.note.deleteMany({ where: { applicationId: { in: applicationIds } } }),
      prisma.interview.deleteMany({ where: { applicationId: { in: applicationIds } } }),
      prisma.statusHistory.deleteMany({ where: { applicationId: { in: applicationIds } } }),
      prisma.application.deleteMany({ where: { userId } })
    );
  }

  ops.push(
    prisma.task.deleteMany({ where: { userId } }),
    prisma.company.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  );

  await prisma.$transaction(ops);

  return { message: "Account deleted successfully" };
}

module.exports = {
  updateProfile,
  changePassword,
  getProfileStats,
  getPreferences,
  updatePreferences,
  deleteAccount,
};
