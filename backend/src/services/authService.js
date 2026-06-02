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

function buildOtpBoxes(otp) {
  return otp
    .split("")
    .map(
      (digit) => `
        <span style="
          display: inline-block;
          width: 46px;
          height: 52px;
          line-height: 52px;
          margin-right: 10px;
          border: 1px solid #93a4c7;
          border-radius: 8px;
          color: #3158b7;
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          background: #ffffff;
        ">${digit}</span>
      `
    )
    .join("");
}

async function sendVerificationOtpEmail(user, otp) {
  const verifyUrl = `${env.appUrl}/verify-email?email=${encodeURIComponent(
    user.email
  )}&otp=${encodeURIComponent(otp)}`;

  await sendMail({
    to: user.email,
    subject: "Verify your InternFlow email",
    text: `Your InternFlow verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <!doctype html>
      <html>
        <body style="margin: 0; padding: 0; background: #eef4ff; font-family: Arial, Helvetica, sans-serif; color: #334155;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #eef4ff; padding: 32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 720px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(49, 88, 183, 0.14);">
                  <tr>
                    <td align="center" style="padding: 28px 24px 22px;">
                      <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; margin-right: 10px; border-radius: 10px; background: #3158d4; color: #ffffff; font-weight: 800; text-align: center;">
                        IF
                      </div>
                      <span style="vertical-align: middle; color: #3158b7; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">
                        InternFlow
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="background: #3158d4; padding: 52px 24px;">
                      <div style="width: 160px; margin: 0 auto 24px; border-top: 2px solid rgba(255,255,255,0.65);">
                        <span style="display: inline-block; margin-top: -13px; padding: 0 14px; background: #3158d4; color: #ffffff; font-size: 20px;">✉</span>
                      </div>
                      <p style="margin: 0 0 14px; color: rgba(255,255,255,0.82); font-size: 18px; letter-spacing: 0.18em; text-transform: uppercase;">
                        Thanks for signing up!
                      </p>
                      <h1 style="margin: 0; color: #ffffff; font-size: 34px; line-height: 1.2; font-weight: 800;">
                        Verify Your Email Address
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 38px 44px 44px;">
                      <p style="margin: 0 0 22px; font-size: 18px;">Hello ${user.name},</p>
                      <p style="margin: 0 0 24px; font-size: 17px; line-height: 1.7;">
                        Your verification code for InternFlow is:
                      </p>
                      <div style="margin: 0 0 26px; white-space: nowrap;">
                        ${buildOtpBoxes(otp)}
                      </div>
                      <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.7;">
                        This passcode will only be valid for the next <strong>${OTP_TTL_MINUTES} minutes</strong>.
                        If you did not request a verification code, please ignore this email.
                      </p>
                      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 24px; border-radius: 8px; background: #f05a28; color: #ffffff; font-size: 16px; font-weight: 800; text-decoration: none;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
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
