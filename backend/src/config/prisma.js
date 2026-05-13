const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const env = require("./env");

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
