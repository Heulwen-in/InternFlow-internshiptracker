jest.mock("../../utils/mailer", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

const { prisma, cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser } = require("../helpers/auth");
const { buildReminderCandidates } = require("../../services/reminderService");

let user, company;

beforeEach(async () => {
  await cleanDb();
  user = await makeVerifiedUser({
    preferences: {
      deadlineReminders: true,
      reminderDaysBefore: [0, 3],
    },
  });
  company = await prisma.company.create({
    data: { userId: user.id, name: "Acme Corp" },
  });
});

afterAll(() => disconnect());

describe("buildReminderCandidates", () => {
  test("selects upcoming deadline reminders and overdue tasks", async () => {
    const now = new Date("2026-06-29T12:00:00.000Z");
    const deadline = new Date("2026-07-02T09:00:00.000Z");
    const overdue = new Date("2026-06-27T09:00:00.000Z");

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        companyId: company.id,
        roleTitle: "Frontend Intern",
        status: "Applied",
        deadline,
      },
    });
    await prisma.task.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        title: "Send follow-up",
        dueDate: overdue,
      },
    });

    const candidates = await buildReminderCandidates(user.id, now);

    expect(candidates.map((item) => item.kind)).toEqual(["task", "deadline"]);
    expect(candidates[0].title).toContain("overdue");
    expect(candidates[1].title).toContain("deadline");
  });
});
