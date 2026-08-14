const prisma = require("../config/prisma");

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function createTaskIfMissing({ userId, applicationId, title, dueDate }) {
  const existing = await prisma.task.findFirst({
    where: {
      userId,
      applicationId,
      title,
      completed: false,
    },
  });

  if (existing) return existing;

  return prisma.task.create({
    data: {
      userId,
      applicationId,
      title,
      dueDate,
    },
  });
}

async function createStatusFollowUps(application, nextStatus) {
  if (nextStatus === "Applied") {
    return [
      await createTaskIfMissing({
        userId: application.userId,
        applicationId: application.id,
        title: `Follow up with ${application.company?.name || "the recruiter"}`,
        dueDate: addDays(new Date(), 7),
      }),
    ];
  }

  if (nextStatus === "Interview") {
    return [
      await createTaskIfMissing({
        userId: application.userId,
        applicationId: application.id,
        title: `Prepare interview notes for ${application.company?.name || "this application"}`,
        dueDate: addDays(new Date(), 1),
      }),
    ];
  }

  if (nextStatus === "Offer") {
    return [
      await createTaskIfMissing({
        userId: application.userId,
        applicationId: application.id,
        title: `Review offer details for ${application.company?.name || "this role"}`,
        dueDate: addDays(new Date(), 3),
      }),
    ];
  }

  return [];
}

async function createInterviewFollowUps(application, interview) {
  const interviewDate = new Date(interview.interviewDate);
  return [
    await createTaskIfMissing({
      userId: application.userId,
      applicationId: application.id,
      title: `Send thank-you note to ${application.company?.name || "interviewer"}`,
      dueDate: addDays(interviewDate, 1),
    }),
  ];
}

module.exports = {
  createStatusFollowUps,
  createInterviewFollowUps,
  createTaskIfMissing,
};
