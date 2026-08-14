const prisma = require("../config/prisma");

const STATUSES = [
  "Saved",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

function weekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeTimeInStatus(applications, now = new Date()) {
  const buckets = Object.fromEntries(STATUSES.map((status) => [status, []]));

  applications.forEach((application) => {
    const history = [...application.statusHistory].sort(
      (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
    );

    if (history.length === 0) {
      const days = (now - new Date(application.createdAt)) / 86400000;
      buckets[application.status]?.push(Math.max(days, 0));
      return;
    }

    history.forEach((entry, index) => {
      const next = history[index + 1]?.changedAt || now;
      const days = (new Date(next) - new Date(entry.changedAt)) / 86400000;
      if (buckets[entry.newStatus]) buckets[entry.newStatus].push(Math.max(days, 0));
    });
  });

  return STATUSES.map((status) => ({
    status,
    averageDays: Number(average(buckets[status]).toFixed(1)),
    samples: buckets[status].length,
  }));
}

async function getOverview(userId) {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      company: true,
      statusHistory: true,
    },
  });

  const total = applications.length;
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  applications.forEach((application) => {
    byStatus[application.status] = (byStatus[application.status] || 0) + 1;
  });

  const active = applications.filter((app) => app.status !== "Rejected").length;
  const reachedResponse = applications.filter((app) =>
    ["Online Assessment", "Interview", "Offer", "Rejected"].includes(app.status)
  ).length;
  const offers = byStatus.Offer || 0;
  const applied = applications.filter((app) => app.status !== "Saved").length || total;

  const weeklyActivity = [];
  const weekMap = new Map();
  const current = new Date();
  for (let i = 7; i >= 0; i -= 1) {
    const d = new Date(current);
    d.setDate(current.getDate() - i * 7);
    const key = weekKey(d);
    weekMap.set(key, { week: key, applications: 0 });
  }
  applications.forEach((application) => {
    const key = weekKey(application.appliedDate || application.createdAt);
    if (weekMap.has(key)) weekMap.get(key).applications += 1;
  });
  weeklyActivity.push(...weekMap.values());

  return {
    total,
    active,
    funnel: STATUSES.map((status) => ({ status, count: byStatus[status] || 0 })),
    responseRate: applied ? Number(((reachedResponse / applied) * 100).toFixed(1)) : 0,
    offerRate: applied ? Number(((offers / applied) * 100).toFixed(1)) : 0,
    timeInStatus: computeTimeInStatus(applications),
    weeklyActivity,
  };
}

module.exports = { getOverview, computeTimeInStatus };
