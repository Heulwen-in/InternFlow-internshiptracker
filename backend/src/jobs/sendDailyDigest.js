const { sendDailyDigests } = require("../services/reminderService");
const prisma = require("../config/prisma");

sendDailyDigests()
  .then((result) => {
    console.log(
      `InternFlow daily digest complete: processed ${result.processed} user${result.processed === 1 ? "" : "s"}.`
    );
  })
  .catch((error) => {
    console.error("InternFlow daily digest failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
