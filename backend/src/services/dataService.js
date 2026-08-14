const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { toDate } = require("../utils/date");

const CSV_HEADERS = [
  "company",
  "roleTitle",
  "status",
  "priority",
  "workType",
  "location",
  "jobUrl",
  "appliedDate",
  "deadline",
];

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function parseCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => normalizeKey(header));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, cells[index]?.trim() || ""])
    );
  });
}

async function exportData(userId) {
  const [companies, applications, tasks] = await Promise.all([
    prisma.company.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.application.findMany({
      where: { userId },
      include: {
        company: true,
        notes: true,
        tasks: true,
        interviews: true,
        statusHistory: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { userId, applicationId: null },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    companies,
    applications,
    standaloneTasks: tasks,
  };
}

async function exportApplicationsCsv(userId) {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { updatedAt: "desc" },
  });
  const rows = applications.map((app) => [
    app.company?.name,
    app.roleTitle,
    app.status,
    app.priority,
    app.workType,
    app.location,
    app.jobUrl,
    app.appliedDate?.toISOString().slice(0, 10),
    app.deadline?.toISOString().slice(0, 10),
  ]);
  return [CSV_HEADERS.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}

async function findOrCreateCompany(userId, rawCompany) {
  const name = String(rawCompany?.name || rawCompany || "").trim();
  if (!name) throw new HttpError(400, "Company name is required");

  const existing = await prisma.company.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (existing) return existing;

  return prisma.company.create({
    data: {
      userId,
      name,
      website: rawCompany?.website || null,
      industry: rawCompany?.industry || null,
      location: rawCompany?.location || null,
    },
  });
}

async function applicationExists(userId, companyName, roleTitle) {
  return prisma.application.findFirst({
    where: {
      userId,
      roleTitle: { equals: roleTitle, mode: "insensitive" },
      company: {
        name: { equals: companyName, mode: "insensitive" },
      },
    },
  });
}

async function importApplication(userId, raw) {
  const companyName = raw.company?.name || raw.company || raw.companyname;
  const roleTitle = String(raw.roleTitle || raw.roletitle || raw.role || "").trim();
  if (!companyName || !roleTitle) return { skipped: true, reason: "Missing company or role" };

  const duplicate = await applicationExists(userId, companyName, roleTitle);
  if (duplicate) return { skipped: true, reason: "Duplicate application" };

  const company = await findOrCreateCompany(userId, raw.company || companyName);
  const application = await prisma.application.create({
    data: {
      userId,
      companyId: company.id,
      roleTitle,
      jobUrl: raw.jobUrl || raw.joburl || null,
      location: raw.location || null,
      workType: raw.workType || raw.worktype || null,
      status: raw.status || "Saved",
      appliedDate: toDate(raw.appliedDate || raw.applieddate),
      deadline: toDate(raw.deadline),
      priority: raw.priority || null,
      statusHistory: {
        create: {
          oldStatus: null,
          newStatus: raw.status || "Saved",
        },
      },
    },
  });

  return { created: true, application };
}

async function importJson(userId, payload) {
  const applications = Array.isArray(payload?.applications) ? payload.applications : [];
  const standaloneTasks = Array.isArray(payload?.standaloneTasks)
    ? payload.standaloneTasks
    : Array.isArray(payload?.tasks)
      ? payload.tasks.filter((task) => !task.applicationId)
      : [];

  const summary = { created: 0, skipped: 0, tasksCreated: 0, reasons: [] };

  for (const raw of applications) {
    const result = await importApplication(userId, raw);
    if (result.created) summary.created += 1;
    if (result.skipped) {
      summary.skipped += 1;
      summary.reasons.push(result.reason);
    }
  }

  for (const task of standaloneTasks) {
    if (!task.title) continue;
    await prisma.task.create({
      data: {
        userId,
        title: task.title,
        dueDate: toDate(task.dueDate),
        completed: Boolean(task.completed),
      },
    });
    summary.tasksCreated += 1;
  }

  return summary;
}

async function importCsv(userId, payload) {
  const rows = parseCsv(payload);
  const summary = { created: 0, skipped: 0, tasksCreated: 0, reasons: [] };
  for (const row of rows) {
    const result = await importApplication(userId, row);
    if (result.created) summary.created += 1;
    if (result.skipped) {
      summary.skipped += 1;
      summary.reasons.push(result.reason);
    }
  }
  return summary;
}

async function importData(userId, { format, payload }) {
  if (format === "csv") return importCsv(userId, payload);
  if (format === "json") return importJson(userId, payload);
  throw new HttpError(400, "Import format must be json or csv");
}

module.exports = {
  exportData,
  exportApplicationsCsv,
  importData,
  parseCsv,
};
