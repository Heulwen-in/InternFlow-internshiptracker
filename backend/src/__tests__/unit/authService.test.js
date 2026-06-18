// jest.mock() calls are hoisted before imports — this is intentional.
jest.mock("../../config/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
}));

jest.mock("../../utils/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const { sendMail } = require("../../utils/mailer");
const authService = require("../../services/authService");

function makeOtpHash(otp) {
  return crypto
    .createHash("sha256")
    .update(`${otp}.${process.env.JWT_SECRET}`)
    .digest("hex");
}

beforeEach(() => jest.clearAllMocks());

// ─── register ───────────────────────────────────────────────────────────────

describe("register", () => {
  test("400 — missing name", async () => {
    await expect(
      authService.register({ email: "a@b.com", password: "Password1!" })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("400 — missing email", async () => {
    await expect(
      authService.register({ name: "Alice", password: "Password1!" })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("400 — missing password", async () => {
    await expect(
      authService.register({ name: "Alice", email: "a@b.com" })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("400 — password too short (≤ 8 chars)", async () => {
    await expect(
      authService.register({ name: "Alice", email: "a@b.com", password: "Ab1!" })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("more than 8") });
  });

  test("400 — password has no digit", async () => {
    await expect(
      authService.register({ name: "Alice", email: "a@b.com", password: "Password!" })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("number") });
  });

  test("400 — password has no capital letter", async () => {
    await expect(
      authService.register({ name: "Alice", email: "a@b.com", password: "password1!" })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("capital") });
  });

  test("400 — password has no special character", async () => {
    await expect(
      authService.register({ name: "Alice", email: "a@b.com", password: "Password123" })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("special") });
  });

  test("400 — name longer than 100 characters", async () => {
    await expect(
      authService.register({ name: "A".repeat(101), email: "a@b.com", password: "Password1!" })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("409 — duplicate email", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "a@b.com" });
    await expect(
      authService.register({ name: "Alice", email: "a@b.com", password: "Password1!" })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("normalises email to lowercase before lookup", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, name: "Alice", email: "alice@example.com", createdAt: new Date(),
    });

    await authService.register({
      name: "Alice", email: "ALICE@EXAMPLE.COM", password: "Password1!",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
    });
  });

  test("stores bcrypt hash, not the plaintext password", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, name: "Alice", email: "alice@example.com", createdAt: new Date(),
    });

    await authService.register({ name: "Alice", email: "alice@example.com", password: "Password1!" });

    const { passwordHash } = prisma.user.create.mock.calls[0][0].data;
    expect(passwordHash).not.toBe("Password1!");
    expect(await bcrypt.compare("Password1!", passwordHash)).toBe(true);
  });

  test("stores OTP as SHA-256 hash, never plaintext", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, name: "Alice", email: "alice@example.com", createdAt: new Date(),
    });

    await authService.register({ name: "Alice", email: "alice@example.com", password: "Password1!" });

    const { emailVerificationOtpHash } = prisma.user.create.mock.calls[0][0].data;
    expect(emailVerificationOtpHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("sends a verification email to the new user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, name: "Alice", email: "alice@example.com", createdAt: new Date(),
    });

    await authService.register({ name: "Alice", email: "alice@example.com", password: "Password1!" });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("alice@example.com");
    expect(sendMail.mock.calls[0][0].subject).toMatch(/verify/i);
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe("login", () => {
  test("400 — missing fields", async () => {
    await expect(authService.login({ email: "a@b.com" }))
      .rejects.toMatchObject({ status: 400 });
  });

  test("401 — unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: "ghost@x.com", password: "Password1!" }))
      .rejects.toMatchObject({ status: 401 });
  });

  test("401 — wrong password", async () => {
    const hash = await bcrypt.hash("CorrectPassword1!", 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: "a@b.com", passwordHash: hash, emailVerified: true,
    });

    await expect(authService.login({ email: "a@b.com", password: "WrongPassword1!" }))
      .rejects.toMatchObject({ status: 401 });
  });

  test("403 — correct password but email not verified", async () => {
    const hash = await bcrypt.hash("Password1!", 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: "a@b.com", passwordHash: hash, emailVerified: false,
    });

    await expect(authService.login({ email: "a@b.com", password: "Password1!" }))
      .rejects.toMatchObject({ status: 403 });
  });

  test("200 — returns JWT and public user (no passwordHash)", async () => {
    const hash = await bcrypt.hash("Password1!", 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 1, name: "Alice", email: "a@b.com", passwordHash: hash,
      emailVerified: true, createdAt: new Date(),
    });

    const result = await authService.login({ email: "a@b.com", password: "Password1!" });

    expect(result.token).toBeDefined();
    expect(result.user).toMatchObject({ id: 1, name: "Alice", email: "a@b.com" });
    expect(result.user.passwordHash).toBeUndefined();
  });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe("verifyEmail", () => {
  const OTP = "234567";

  test("400 — missing fields", async () => {
    await expect(authService.verifyEmail({ email: "a@b.com" }))
      .rejects.toMatchObject({ status: 400 });
  });

  test("404 — unknown account", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.verifyEmail({ email: "ghost@x.com", otp: OTP }))
      .rejects.toMatchObject({ status: 404 });
  });

  test("400 — already verified", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "a@b.com", emailVerified: true });
    await expect(authService.verifyEmail({ email: "a@b.com", otp: OTP }))
      .rejects.toMatchObject({ status: 400 });
  });

  test("400 — OTP expired", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: "a@b.com", emailVerified: false,
      emailVerificationOtpHash: makeOtpHash(OTP),
      emailVerificationOtpExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(authService.verifyEmail({ email: "a@b.com", otp: OTP }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining("expired") });
  });

  test("400 — wrong OTP", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: "a@b.com", emailVerified: false,
      emailVerificationOtpHash: makeOtpHash(OTP),
      emailVerificationOtpExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(authService.verifyEmail({ email: "a@b.com", otp: "999999" }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining("Invalid") });
  });

  test("returns token on correct OTP and clears OTP fields in DB", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1, name: "Alice", email: "a@b.com", emailVerified: false,
      emailVerificationOtpHash: makeOtpHash(OTP),
      emailVerificationOtpExpiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    prisma.user.update.mockResolvedValue({
      id: 1, name: "Alice", email: "a@b.com", emailVerified: true, createdAt: new Date(),
    });

    const result = await authService.verifyEmail({ email: "a@b.com", otp: OTP });

    expect(result.token).toBeDefined();
    const updateData = prisma.user.update.mock.calls[0][0].data;
    expect(updateData.emailVerified).toBe(true);
    expect(updateData.emailVerificationOtpHash).toBeNull();
    expect(updateData.emailVerificationOtpExpiresAt).toBeNull();
  });
});

// ─── resendVerification ───────────────────────────────────────────────────────

describe("resendVerification", () => {
  test("returns generic message for unknown email (no user enumeration)", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const result = await authService.resendVerification({ email: "ghost@x.com" });
    expect(result.message).toBe("Verification code sent");
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("returns generic message for already-verified account (no enumeration)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "a@b.com", emailVerified: true });
    const result = await authService.resendVerification({ email: "a@b.com" });
    expect(result.message).toBe("Verification code sent");
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("sends a new OTP for a valid unverified account", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1, name: "Alice", email: "a@b.com", emailVerified: false,
    });
    prisma.user.update.mockResolvedValue({});

    await authService.resendVerification({ email: "a@b.com" });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const updateData = prisma.user.update.mock.calls[0][0].data;
    expect(updateData.emailVerificationOtpHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────

describe("forgotPassword", () => {
  test("returns generic message for unknown email (no enumeration)", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const result = await authService.forgotPassword({ email: "ghost@x.com" });
    expect(result.message).toContain("If an account exists");
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("sends reset email and stores hashed token for known account", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "a@b.com" });
    prisma.user.update.mockResolvedValue({});

    const result = await authService.forgotPassword({ email: "a@b.com" });

    expect(result.message).toContain("If an account exists");
    expect(sendMail).toHaveBeenCalledTimes(1);
    const updateData = prisma.user.update.mock.calls[0][0].data;
    expect(updateData.passwordResetTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(updateData.passwordResetTokenExpiresAt).toBeInstanceOf(Date);
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe("resetPassword", () => {
  test("400 — missing token or password", async () => {
    await expect(authService.resetPassword({ token: "abc" }))
      .rejects.toMatchObject({ status: 400 });
  });

  test("400 — weak new password", async () => {
    await expect(authService.resetPassword({ token: "abc", password: "weak" }))
      .rejects.toMatchObject({ status: 400 });
  });

  test("400 — expired or unknown token", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(authService.resetPassword({ token: "badtoken", password: "NewPassword1!" }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining("expired") });
  });

  test("success — stores new bcrypt hash, clears token fields", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1, email: "a@b.com" });
    prisma.user.update.mockResolvedValue({});

    await authService.resetPassword({ token: "validtoken", password: "NewPassword1!" });

    const updateData = prisma.user.update.mock.calls[0][0].data;
    expect(updateData.passwordResetTokenHash).toBeNull();
    expect(updateData.passwordResetTokenExpiresAt).toBeNull();
    expect(await bcrypt.compare("NewPassword1!", updateData.passwordHash)).toBe(true);
  });
});
