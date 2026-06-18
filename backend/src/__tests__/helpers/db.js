const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Use the test DATABASE_URL set by setEnv.js
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Delete all rows in dependency order (children before parents).
async function cleanDb() {
  await prisma.statusHistory.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.application.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, cleanDb, disconnect };
