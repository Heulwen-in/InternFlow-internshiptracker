// Runs after every test file. Disconnects the app's Prisma singleton so Jest exits cleanly.
afterAll(async () => {
  try {
    const prisma = require("../config/prisma");
    await prisma.$disconnect();
  } catch {
    // Not loaded in this test file — nothing to do.
  }
});
