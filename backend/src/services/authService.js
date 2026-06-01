const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { sendMail } = require("../utils/mailer");

const SALT_ROUNDS = 12;
const TOKEN_TTL = "7d";
const OTP_TTL_MINUTES = 10;
const PASSWORD_RESET_TTL_MINUTES = 30;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, userId: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: TOKEN_TTL,
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashSecret(value) {
  return crypto.createHash("sha256").update(`${value}.${env.jwtSecret}`).digest("hex");
}

function expiresInMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function sendVerificationOtpEmail(email, otp) {
  await sendMail({
    to: email,
    subject: "Verify your InternFlow email",
    text: `Your InternFlow verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <p>Your InternFlow verification code is:</p>
      <h2 style="letter-spacing: 0.2em;">${otp}</h2>
      <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
    `,
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "Reset your InternFlow password",
    text: `Reset your InternFlow password here: ${resetUrl}. This link expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.`,
    html: `
      <p>Use the link below to reset your InternFlow password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.</p>
    `,
  });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long");
  }

  const normalizedEmail = normalizeEmail(email);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new HttpError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const otp = generateOtp();

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerificationOtpHash: hashSecret(otp),
      emailVerificationOtpExpiresAt: expiresInMinutes(OTP_TTL_MINUTES),
    },
  });

  await sendVerificationOtpEmail(user.email, otp);

  return {
    email: user.email,
    message: "Registration successful. Check your email for the verification code.",
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Constant-ish behaviour: still hash-compare on a dummy hash when user missing,
  // so timing leaks less info about which emails exist.
  const validPassword = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvaliduO");

  if (!user || !validPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new HttpError(403, "Please verify your email before logging in");
  }

  return { user: publicUser(user), token: signToken(user) };
}

async function verifyEmail({ email, otp }) {
  if (!email || !otp) {
    throw new HttpError(400, "email and OTP are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    throw new HttpError(404, "Account not found");
  }

  if (user.emailVerified) {
    return { user: publicUser(user), token: signToken(user) };
  }

  const otpExpired =
    !user.emailVerificationOtpExpiresAt ||
    user.emailVerificationOtpExpiresAt.getTime() < Date.now();

  if (otpExpired || user.emailVerificationOtpHash !== hashSecret(otp)) {
    throw new HttpError(400, "Invalid or expired verification code");
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationOtpHash: null,
      emailVerificationOtpExpiresAt: null,
    },
  });

  return { user: publicUser(verifiedUser), token: signToken(verifiedUser) };
}

async function resendVerification({ email }) {
  if (!email) {
    throw new HttpError(400, "email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    throw new HttpError(404, "Account not found");
  }

  if (user.emailVerified) {
    throw new HttpError(400, "Email is already verified");
  }

  const otp = generateOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationOtpHash: hashSecret(otp),
      emailVerificationOtpExpiresAt: expiresInMinutes(OTP_TTL_MINUTES),
    },
  });

  await sendVerificationOtpEmail(user.email, otp);

  return { message: "Verification code sent" };
}

async function forgotPassword({ email }) {
  if (!email) {
    throw new HttpError(400, "email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    return {
      message: "If an account exists for that email, a password reset link was sent.",
    };
  }

  const token = generateResetToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashSecret(token),
      passwordResetTokenExpiresAt: expiresInMinutes(PASSWORD_RESET_TTL_MINUTES),
    },
  });

  await sendPasswordResetEmail(user.email, token);

  return {
    message: "If an account exists for that email, a password reset link was sent.",
  };
}

async function resetPassword({ token, password }) {
  if (!token || !password) {
    throw new HttpError(400, "token and password are required");
  }
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long");
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashSecret(token),
      passwordResetTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new HttpError(400, "Invalid or expired reset link");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  return { message: "Password reset successful. You can now log in." };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyToken,
  publicUser,
};
