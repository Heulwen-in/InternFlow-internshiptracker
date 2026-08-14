// Integration tests for the full Application lifecycle.

jest.mock("../../utils/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const app = require("../../app");
const { prisma, cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser, makeToken } = require("../helpers/auth");

let user, token, company;

beforeEach(async () => {
  await cleanDb();
  user = await makeVerifiedUser();
  token = makeToken(user);
  company = await prisma.company.create({
    data: { userId: user.id, name: "Acme Corp" },
  });
});

afterAll(() => disconnect());

// ─── Create ───────────────────────────────────────────────────────────────────

describe("POST /api/applications", () => {
  test("201 — creates application with an initial status history entry", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ companyId: company.id, roleTitle: "Engineer", status: "Applied" });

    expect(res.status).toBe(201);
    expect(res.body.application.roleTitle).toBe("Engineer");
    expect(res.body.application.statusHistory).toHaveLength(1);
    expect(res.body.application.statusHistory[0].newStatus).toBe("Applied");
    expect(res.body.application.statusHistory[0].oldStatus).toBeNull();
  });

  test("400 — missing roleTitle", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ companyId: company.id });
    expect(res.status).toBe(400);
  });

  test("400 — roleTitle exceeds 200 characters", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ companyId: company.id, roleTitle: "A".repeat(201) });
    expect(res.status).toBe(400);
  });

  test("404 — companyId belongs to another user", async () => {
    const other = await makeVerifiedUser({ email: "other@example.com" });
    const otherCompany = await prisma.company.create({
      data: { userId: other.id, name: "Other Co" },
    });

    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ companyId: otherCompany.id, roleTitle: "Engineer" });
    expect(res.status).toBe(404);
  });

  test("GET /api/applications only returns the current user's records", async () => {
    const other = await makeVerifiedUser({ email: "other2@example.com" });
    const otherToken = makeToken(other);
    const otherCompany = await prisma.company.create({
      data: { userId: other.id, name: "Other Co" },
    });
    await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ companyId: otherCompany.id, roleTitle: "Other Role" });

    await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ companyId: company.id, roleTitle: "My Role" });

    const res = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].roleTitle).toBe("My Role");
  });
});

// ─── Update / status history ──────────────────────────────────────────────────

describe("PUT /api/applications/:id", () => {
  test("status change appends a status history entry with correct old/new values", async () => {
    const created = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, roleTitle: "Dev", status: "Saved",
      },
    });

    const res = await request(app)
      .put(`/api/applications/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Applied" });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("Applied");
    expect(res.body.application.statusHistory).toHaveLength(1);
    expect(res.body.application.statusHistory[0]).toMatchObject({
      oldStatus: "Saved",
      newStatus: "Applied",
    });
  });

  test("update with same status does NOT create a new history entry", async () => {
    const created = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, roleTitle: "Dev", status: "Saved",
      },
    });

    const res = await request(app)
      .put(`/api/applications/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Saved", roleTitle: "Senior Dev" });

    expect(res.status).toBe(200);
    expect(res.body.application.statusHistory).toHaveLength(0);
  });

  test("status change to Applied creates a follow-up task once", async () => {
    const created = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, roleTitle: "Dev", status: "Saved",
      },
    });

    await request(app)
      .put(`/api/applications/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Applied" });
    await request(app)
      .put(`/api/applications/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Applied" });

    const tasks = await prisma.task.findMany({
      where: { userId: user.id, applicationId: created.id },
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain("Follow up");
  });
});

// ─── Delete cascade ───────────────────────────────────────────────────────────

describe("DELETE /api/applications/:id", () => {
  test("succeeds even when the application has linked tasks — tasks are unlinked", async () => {
    const application = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, roleTitle: "Dev", status: "Saved",
      },
    });
    const task = await prisma.task.create({
      data: { userId: user.id, applicationId: application.id, title: "Prepare portfolio" },
    });

    const res = await request(app)
      .delete(`/api/applications/${application.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Application is gone
    const found = await prisma.application.findUnique({ where: { id: application.id } });
    expect(found).toBeNull();

    // Task still exists but is no longer linked
    const updatedTask = await prisma.task.findUnique({ where: { id: task.id } });
    expect(updatedTask).not.toBeNull();
    expect(updatedTask.applicationId).toBeNull();
  });

  test("deletes linked notes and interviews", async () => {
    const application = await prisma.application.create({
      data: {
        userId: user.id, companyId: company.id, roleTitle: "Dev", status: "Saved",
      },
    });
    const note = await prisma.note.create({
      data: { applicationId: application.id, content: "Some note" },
    });
    const interview = await prisma.interview.create({
      data: { applicationId: application.id, interviewDate: new Date() },
    });

    await request(app)
      .delete(`/api/applications/${application.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull();
    expect(await prisma.interview.findUnique({ where: { id: interview.id } })).toBeNull();
  });

  test("404 for non-existent application", async () => {
    const res = await request(app)
      .delete("/api/applications/99999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Body size limit ──────────────────────────────────────────────────────────

describe("Payload size limit", () => {
  test("413 when body exceeds the JSON parser limit", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ companyId: company.id, roleTitle: "x".repeat(600_000) }));

    expect(res.status).toBe(413);
  });
});
