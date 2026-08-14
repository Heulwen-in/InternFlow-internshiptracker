const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { normalizePreferences } = require("./profileService");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function daysUntil(date, now = new Date()) {
  if (!date) return null;
  return Math.ceil((startOfDay(new Date(date)) - startOfDay(now)) / MS_PER_DAY);
}

function relDay(days) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  return `in ${days} days`;
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function makeReminderKey(kind, id, date, days) {
  return `${kind}:${id}:${dateKey(date)}:${days}`;
}

async function buildReminderCandidates(userId, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!user) throw new HttpError(404, "Account not found");

  const preferences = normalizePreferences(user.preferences);
  const reminderDays = preferences.reminderDaysBefore;
  const maxReminderDays = Math.max(...reminderDays, 0);
  const end = new Date(startOfDay(now).getTime() + maxReminderDays * MS_PER_DAY);
  end.setHours(23, 59, 59, 999);

  const [applications, tasks, interviews] = await Promise.all([
    prisma.application.findMany({
      where: {
        userId,
        deadline: { not: null, lte: end },
        status: { notIn: ["Rejected", "Offer"] },
      },
      include: { company: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: { not: null },
      },
      include: { application: { include: { company: true } } },
    }),
    prisma.interview.findMany({
      where: {
        interviewDate: { lte: end },
        application: { userId, status: { not: "Rejected" } },
      },
      include: { application: { include: { company: true } } },
    }),
  ]);

  const candidates = [];

  if (preferences.deadlineReminders) {
    applications.forEach((application) => {
      const days = daysUntil(application.deadline, now);
      if (!reminderDays.includes(days)) return;
      candidates.push({
        kind: "deadline",
        applicationId: application.id,
        when: application.deadline,
        days,
        title: `${application.company?.name || "Application"} deadline ${relDay(days)}`,
        body: `${application.roleTitle} deadline is ${relDay(days)}.`,
        reminderKey: makeReminderKey("deadline", application.id, application.deadline, days),
      });
    });
  }

  tasks.forEach((task) => {
    const days = daysUntil(task.dueDate, now);
    const shouldRemind = days < 0 || reminderDays.includes(days);
    if (!shouldRemind) return;
    candidates.push({
      kind: "task",
      applicationId: task.applicationId,
      when: task.dueDate,
      days,
      title: `Task ${relDay(days)}`,
      body: task.application
        ? `${task.title} for ${task.application.company?.name || "application"} is ${relDay(days)}.`
        : `${task.title} is ${relDay(days)}.`,
      reminderKey: makeReminderKey("task", task.id, task.dueDate, days),
    });
  });

  interviews.forEach((interview) => {
    const days = daysUntil(interview.interviewDate, now);
    if (!reminderDays.includes(days)) return;
    candidates.push({
      kind: "interview",
      applicationId: interview.applicationId,
      when: interview.interviewDate,
      days,
      title: `${interview.interviewType || "Interview"} ${relDay(days)}`,
      body: `${interview.application.company?.name || "Interview"} for ${interview.application.roleTitle} is ${relDay(days)}.`,
      reminderKey: makeReminderKey("interview", interview.id, interview.interviewDate, days),
    });
  });

  return candidates.sort((a, b) => {
    const dayDelta = a.days - b.days;
    if (dayDelta !== 0) return dayDelta;
    return new Date(a.when) - new Date(b.when);
  });
}

async function ensureReminderNotifications(userId, now = new Date()) {
  const candidates = await buildReminderCandidates(userId, now);

  await Promise.all(
    candidates.map((candidate) =>
      prisma.notification.upsert({
        where: { reminderKey: candidate.reminderKey },
        update: {
          title: candidate.title,
          body: candidate.body,
          applicationId: candidate.applicationId,
        },
        create: {
          userId,
          applicationId: candidate.applicationId,
          kind: candidate.kind,
          title: candidate.title,
          body: candidate.body,
          reminderKey: candidate.reminderKey,
        },
      })
    )
  );

  return candidates;
}

async function listNotifications(userId) {
  await ensureReminderNotifications(userId);
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      application: {
        include: { company: true },
      },
    },
  });
  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });
  return { notifications, unreadCount };
}

async function markNotificationRead(userId, id) {
  const notification = await prisma.notification.findFirst({
    where: { id: Number(id), userId },
  });

  if (!notification) throw new HttpError(404, "Notification not found");

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
  });

  return { notification: updated };
}

async function markAllNotificationsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { message: "Notifications marked as read" };
}

module.exports = {
  buildReminderCandidates,
  ensureReminderNotifications,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
