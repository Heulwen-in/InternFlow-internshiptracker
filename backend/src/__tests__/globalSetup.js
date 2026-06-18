const { Client } = require("pg");
const { execSync } = require("child_process");
const path = require("path");

const TEST_DB = "internflow_tracker_test";
const TEST_DB_URL = `postgresql://internflow_user:internflow_password@localhost:5432/${TEST_DB}`;

module.exports = async () => {
  // Create the test database if it doesn't exist yet
  const client = new Client({
    connectionString:
      "postgresql://internflow_user:internflow_password@localhost:5432/postgres",
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [TEST_DB]
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE ${TEST_DB}`);
      console.log(`[test] Created database: ${TEST_DB}`);
    }
  } finally {
    await client.end();
  }

  // Apply migrations to the test DB (cwd must be backend/, where prisma/ lives)
  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, "../.."),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
  });
};
