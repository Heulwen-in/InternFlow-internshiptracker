const request = require("supertest");
const app = require("../../app");
const { prisma, cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser, makeToken } = require("../helpers/auth");

let token;
let application;

beforeEach(async () => {
  await cleanDb();
  const user = await makeVerifiedUser();
  token = makeToken(user);
  const company = await prisma.company.create({
    data: { userId: user.id, name: "Acme Corp" },
  });
  application = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: company.id,
      roleTitle: "Frontend Intern",
    },
  });
});

afterAll(() => disconnect());

describe("note editing", () => {
  test("updates a note owned by the authenticated user", async () => {
    const note = await prisma.note.create({
      data: { applicationId: application.id, content: "Initial note" },
    });

    const res = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "  Updated interview feedback  " });

    expect(res.status).toBe(200);
    expect(res.body.note.content).toBe("Updated interview feedback");
    await expect(
      prisma.note.findUnique({ where: { id: note.id } })
    ).resolves.toMatchObject({ content: "Updated interview feedback" });
  });

  test.each([
    ["empty", "   "],
    ["oversized", "x".repeat(10001)],
  ])("rejects %s note content", async (_label, content) => {
    const note = await prisma.note.create({
      data: { applicationId: application.id, content: "Keep this" },
    });

    const res = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content });

    expect(res.status).toBe(400);
    await expect(
      prisma.note.findUnique({ where: { id: note.id } })
    ).resolves.toMatchObject({ content: "Keep this" });
  });
});
