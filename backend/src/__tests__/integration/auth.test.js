// Mock the mailer so no real SMTP calls are made.
jest.mock("../../utils/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../../app");
const { prisma, cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser, makeToken } = require("../helpers/auth");
const { sendMail } = require("../../utils/mailer");

beforeEach(async () => {
  await cleanDb();
  sendMail.mockClear();
});

afterAll(async () => {
  await disconnect();
});

// ─── Register ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  test("201 — creates account and sends verification email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "Password1!" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@example.com");
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  test("400 — weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "weak" });
    expect(res.status).toBe(400);
  });

  test("400 — missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com" });
    expect(res.status).toBe(400);
  });

  test("409 — duplicate email", async () => {
    await makeVerifiedUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "Password1!" });
    expect(res.status).toBe(409);
  });

  test("does not expose passwordHash or OTP in response", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "Password1!" });
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.emailVerificationOtpHash).toBeUndefined();
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  test("200 — returns JWT and public user for verified account", async () => {
    await makeVerifiedUser({ email: "alice@example.com", password: "Password1!" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password1!" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test("401 — wrong password", async () => {
    await makeVerifiedUser({ email: "alice@example.com", password: "Password1!" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "WrongPassword1!" });
    expect(res.status).toBe(401);
  });

  test("401 — unknown email (same status as wrong password — no enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password1!" });
    expect(res.status).toBe(401);
  });

  test("403 — correct password but email not verified", async () => {
    const passwordHash = await bcrypt.hash("Password1!", 4);
    await prisma.user.create({
      data: { name: "Bob", email: "bob@example.com", passwordHash, emailVerified: false },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "Password1!" });
    expect(res.status).toBe(403);
  });
});

// ─── /auth/me ────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  test("200 — returns user for valid token", async () => {
    const user = await makeVerifiedUser();
    const token = makeToken(user);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test("401 — no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("401 — tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.real.jwt");
    expect(res.status).toBe(401);
  });

  test("401 — deleted user token still rejected", async () => {
    const user = await makeVerifiedUser();
    const token = makeToken(user);
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

describe("Rate limiting", () => {
  test("RateLimit-Limit header is present on login route", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    // The header name varies — standard or legacy format
    const hasLimit =
      res.headers["ratelimit-limit"] ||
      res.headers["x-ratelimit-limit"];
    expect(hasLimit).toBeDefined();
  });
});
