module.exports = async () => {
  // Disconnect the app's Prisma singleton so Jest can exit cleanly.
  try {
    const prisma = require("../config/prisma");
    await prisma.$disconnect();
  } catch {
    // Ignore — module may not have been loaded if only unit tests ran.
  }
};
