const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { sendMail } = require("../utils/mailer");

const SALT_ROUNDS = 12;
const TOKEN_TTL = "7d";
const OTP_TTL_MINUTES = 2;
const PASSWORD_RESET_TTL_MINUTES = 5;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    avatarHue: user.avatarHue ?? null,
    bio: user.bio ?? null,
    school: user.school ?? null,
    graduationYear: user.graduationYear ?? null,
    targetRole: user.targetRole ?? null,
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function getPasswordRuleFailures(password) {
  const failures = [];

  if (password.length <= 8) {
    failures.push("be more than 8 characters");
  }
  if (!/\d/.test(password)) {
    failures.push("include at least one number");
  }
  if (!/[A-Z]/.test(password)) {
    failures.push("include at least one capital letter");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    failures.push("include at least one special character");
  }

  return failures;
}

function assertStrongPassword(password) {
  const failures = getPasswordRuleFailures(password);

  if (failures.length > 0) {
    throw new HttpError(400, `Password must ${failures.join(", and ")}.`);
  }
}

const MAIL = {
  bg: "#f9f5f0",
  surface: "#fefcf9",
  surface2: "#f6f2eb",
  ink: "#241e19",
  ink2: "#564b42",
  muted: "#7e7267",
  faint: "#a0978d",
  line: "#e2dbd2",
  lineStrong: "#cbc3b8",
  accent: "#a94608",
  accentInk: "#fdf9f7",
  fontDisplay: "'Newsreader', Georgia, 'Times New Roman', serif",
  fontUi: "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif",
  fontMono: "'Spline Sans Mono', 'SF Mono', Consolas, monospace",
};

function buildOtpBoxes(otp) {
  const cells = otp
    .split("")
    .map(
      (digit) => `
        <td style="padding: 0 4px;">
          <div style="width: 42px; height: 54px; line-height: 54px; border: 1px solid ${MAIL.lineStrong}; border-radius: 8px; background: ${MAIL.surface}; color: ${MAIL.ink}; font-family: ${MAIL.fontMono}; font-size: 24px; font-weight: 600; text-align: center;">${digit}</div>
        </td>
      `
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;"><tr>${cells}</tr></table>`;
}

function buildEmailShell({ kicker, heading, bodyRows }) {
  return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400..600;1,400..600&family=Schibsted+Grotesk:wght@400..700&family=Spline+Sans+Mono:wght@400..600&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; padding: 0; background: ${MAIL.bg}; font-family: ${MAIL.fontUi}; color: ${MAIL.ink2};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${MAIL.bg}; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background: ${MAIL.surface}; border: 1px solid ${MAIL.line}; border-radius: 14px; overflow: hidden;">
                  <tr>
                    <td style="padding: 30px 40px 0;">
                      <span style="font-family: ${MAIL.fontDisplay}; font-style: italic; font-size: 24px; font-weight: 500; color: ${MAIL.ink}; letter-spacing: -0.01em;">Intern<span style="color: ${MAIL.accent};">Flow</span></span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 22px 40px 0;">
                      <div style="border-top: 1px solid ${MAIL.line}; font-size: 0; line-height: 0;">&nbsp;</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 40px 6px;">
                      <p style="margin: 0 0 16px; font-family: ${MAIL.fontMono}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAIL.accent}; font-weight: 600;">${kicker}</p>
                      <h1 style="margin: 0; font-family: ${MAIL.fontDisplay}; font-size: 30px; line-height: 1.15; font-weight: 500; letter-spacing: -0.015em; color: ${MAIL.ink};">${heading}</h1>
                    </td>
                  </tr>
                  ${bodyRows}
                  <tr>
                    <td style="padding: 22px 40px 28px; border-top: 1px solid ${MAIL.line}; background: ${MAIL.surface2};">
                      <p style="margin: 0; font-family: ${MAIL.fontMono}; font-size: 10.5px; letter-spacing: 0.06em; color: ${MAIL.faint}; line-height: 1.7;">INTERNFLOW &middot; INTERNSHIP SEASON, ORGANIZED<br/>Automated message — please do not reply to this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
  `;
}

async function sendVerificationOtpEmail(user, otp) {
  const verifyUrl = `${env.appUrl}/verify-email?email=${encodeURIComponent(
    user.email
  )}&otp=${encodeURIComponent(otp)}`;

  await sendMail({
    to: user.email,
    subject: "Verify your InternFlow email",
    text: `Your InternFlow verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: buildEmailShell({
      kicker: "Verify your email",
      heading: "Confirm your<br/>email address",
      bodyRows: `
                  <tr>
                    <td style="padding: 18px 40px 0;">
                      <p style="margin: 0 0 6px; font-family: ${MAIL.fontUi}; font-size: 15px; line-height: 1.65; color: ${MAIL.ink2};">Hello ${escapeHtml(user.name)},</p>
                      <p style="margin: 0 0 26px; font-family: ${MAIL.fontUi}; font-size: 15px; line-height: 1.65; color: ${MAIL.ink2};">Enter the verification code below to finish setting up your InternFlow account.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 0 20px 24px;">
                      ${buildOtpBoxes(otp)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 26px;">
                      <p style="margin: 0; font-family: ${MAIL.fontUi}; font-size: 14px; line-height: 1.65; color: ${MAIL.muted};">This code is valid for the next <strong style="color: ${MAIL.ink2};">${OTP_TTL_MINUTES} minutes</strong>. If you didn't create an account, you can safely ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 32px;">
                      <a href="${verifyUrl}" style="display: inline-block; padding: 13px 26px; border-radius: 8px; background: ${MAIL.accent}; color: ${MAIL.accentInk}; font-size: 14px; font-weight: 600; text-decoration: none; font-family: ${MAIL.fontUi};">Verify email</a>
                    </td>
                  </tr>`,
    }),
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "Reset your InternFlow password",
    text: `Reset your InternFlow password here: ${resetUrl}. This link expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.`,
    html: buildEmailShell({
      kicker: "Reset password",
      heading: "Reset your<br/>password",
      bodyRows: `
                  <tr>
                    <td style="padding: 18px 40px 0;">
                      <p style="margin: 0 0 6px; font-family: ${MAIL.fontUi}; font-size: 15px; line-height: 1.65; color: ${MAIL.ink2};">Hello,</p>
                      <p style="margin: 0 0 26px; font-family: ${MAIL.fontUi}; font-size: 15px; line-height: 1.65; color: ${MAIL.ink2};">We received a request to reset your InternFlow password. Use the button below to choose a new one. For your security, this link can only be used once.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 26px;">
                      <a href="${resetUrl}" style="display: inline-block; padding: 13px 26px; border-radius: 8px; background: ${MAIL.accent}; color: ${MAIL.accentInk}; font-size: 14px; font-weight: 600; text-decoration: none; font-family: ${MAIL.fontUi};">Reset password</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 32px;">
                      <p style="margin: 0; font-family: ${MAIL.fontUi}; font-size: 14px; line-height: 1.65; color: ${MAIL.muted};">This reset link is valid for the next <strong style="color: ${MAIL.ink2};">${PASSWORD_RESET_TTL_MINUTES} minutes</strong>. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>
                    </td>
                  </tr>`,
    }),
  });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }
  if (name.trim().length > 100) throw new HttpError(400, "Name must be 100 characters or fewer");
  if (email.length > 254) throw new HttpError(400, "Email address is too long");
  assertStrongPassword(password);

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

  await sendVerificationOtpEmail(user, otp);

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
    throw new HttpError(400, "Email is already verified. Please log in.");
  }

  const otpExpired =
    !user.emailVerificationOtpExpiresAt ||
    user.emailVerificationOtpExpiresAt.getTime() < Date.now();

  if (otpExpired) {
    throw new HttpError(400, "Your link has been expired. Please try again.");
  }

  if (user.emailVerificationOtpHash !== hashSecret(otp)) {
    throw new HttpError(400, "Invalid verification code");
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

  if (!user || user.emailVerified) {
    return { message: "Verification code sent" };
  }

  const otp = generateOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationOtpHash: hashSecret(otp),
      emailVerificationOtpExpiresAt: expiresInMinutes(OTP_TTL_MINUTES),
    },
  });

  await sendVerificationOtpEmail(user, otp);

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

async function validateResetToken({ token }) {
  if (!token) {
    throw new HttpError(400, "This link has been expired");
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashSecret(token),
      passwordResetTokenExpiresAt: {
        gt: new Date(),
      },
    },
    select: { id: true },
  });

  if (!user) {
    throw new HttpError(400, "This link has been expired");
  }

  return { message: "Reset link is valid" };
}

async function resetPassword({ token, password }) {
  if (!token || !password) {
    throw new HttpError(400, "token and password are required");
  }
  assertStrongPassword(password);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashSecret(token),
      passwordResetTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new HttpError(400, "This link has been expired");
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
  validateResetToken,
  resetPassword,
  verifyToken,
  publicUser,
  assertStrongPassword,
};
