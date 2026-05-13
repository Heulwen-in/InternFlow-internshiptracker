require("dotenv").config();

const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

const PLACEHOLDER_SECRETS = new Set([
  "",
  "your_super_secret_key",
  "change_me",
  "changeme",
  "secret",
]);

function fail(message) {
  console.error(`[config] ${message}`);
  process.exit(1);
}

for (const key of REQUIRED) {
  if (!process.env[key] || process.env[key].trim() === "") {
    fail(`Missing required environment variable: ${key}. See .env.example.`);
  }
}

const jwtSecret = process.env.JWT_SECRET.trim();
if (PLACEHOLDER_SECRETS.has(jwtSecret)) {
  fail(
    "JWT_SECRET is using a placeholder value. Generate a real one with:\n" +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}
if (jwtSecret.length < 32) {
  fail("JWT_SECRET must be at least 32 characters long.");
}

const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret,
  corsOrigin,
};
