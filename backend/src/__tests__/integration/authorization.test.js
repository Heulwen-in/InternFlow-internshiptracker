// Tests that users cannot access or modify data owned by other users (IDOR prevention).

jest.mock("../../utils/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const app = require("../../app");
const { prisma, cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser, makeToken } = require("../helpers/auth");

let userA, userB, tokenA, tokenB;
let companyA, appA;

beforeEach(async () => {
  await cleanDb();

  [userA, userB] = await Promise.all([
    makeVerifiedUser({ email: "a@example.com" }),
    makeVerifiedUser({ email: "b@example.com" }),
  ]);
  tokenA = makeToken(userA);
  tokenB = makeToken(userB);

  companyA = await prisma.company.create({
    data: { userId: userA.id, name: "Company A" },
  });

  appA = await prisma.application.create({
    data: {
      userId: userA.id,
      companyId: companyA.id,
      roleTitle: "Engineer",
      status: "Saved",
    },
  });
});

afterAll(() => disconnect());

// ─── Application IDOR ────────────────────────────────────────────────────────

describe("Application ownership", () => {
  test("GET /api/applications/:id → 404 for another user", async () => {
    const res = await request(app)
      .get(`/api/applications/${appA.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("PUT /api/applications/:id → 404 for another user, record unchanged", async () => {
    const res = await request(app)
      .put(`/api/applications/${appA.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ roleTitle: "Hacked" });

    expect(res.status).toBe(404);
    const unchanged = await prisma.application.findUnique({ where: { id: appA.id } });
    expect(unchanged.roleTitle).toBe("Engineer");
  });

  test("DELETE /api/applications/:id → 404 for another user, record still exists", async () => {
    const res = await request(app)
      .delete(`/api/applications/${appA.id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    const stillThere = await prisma.application.findUnique({ where: { id: appA.id } });
    expect(stillThere).not.toBeNull();
  });
});

// ─── Company IDOR ────────────────────────────────────────────────────────────

describe("Company ownership", () => {
  test("GET /api/companies/:id → 404 for another user", async () => {
    const res = await request(app)
      .get(`/api/companies/${companyA.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("DELETE /api/companies/:id → 404 for another user", async () => {
    // Need an app-less company to allow delete
    const soloCompany = await prisma.company.create({
      data: { userId: userA.id, name: "Solo Co" },
    });

    const res = await request(app)
      .delete(`/api/companies/${soloCompany.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

// ─── Note / Interview IDOR ───────────────────────────────────────────────────

describe("Note and Interview ownership via application", () => {
  test("GET /api/applications/:id/notes → 404 for another user", async () => {
    const res = await request(app)
      .get(`/api/applications/${appA.id}/notes`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("POST /api/applications/:id/notes → 404 for another user", async () => {
    const res = await request(app)
      .post(`/api/applications/${appA.id}/notes`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ content: "Injected note" });
    expect(res.status).toBe(404);
  });

  test("DELETE /api/notes/:id → 404 for another user", async () => {
    const note = await prisma.note.create({
      data: { applicationId: appA.id, content: "Private note" },
    });

    const res = await request(app)
      .delete(`/api/notes/${note.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("DELETE /api/interviews/:id → 404 for another user", async () => {
    const interview = await prisma.interview.create({
      data: { applicationId: appA.id, interviewDate: new Date() },
    });

    const res = await request(app)
      .delete(`/api/interviews/${interview.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

// ─── Task IDOR ───────────────────────────────────────────────────────────────

describe("Task ownership", () => {
  test("DELETE /api/tasks/:id → 404 for another user", async () => {
    const task = await prisma.task.create({
      data: { userId: userA.id, title: "A's task" },
    });

    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

// ─── Unauthenticated access ───────────────────────────────────────────────────

describe("Protected routes reject requests without a token", () => {
  const routes = [
    ["get", "/api/applications"],
    ["post", "/api/applications"],
    ["get", "/api/companies"],
    ["post", "/api/companies"],
    ["get", "/api/tasks"],
    ["post", "/api/tasks"],
    ["get", "/api/interviews"],
  ];

  test.each(routes)("%s %s → 401", async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});
