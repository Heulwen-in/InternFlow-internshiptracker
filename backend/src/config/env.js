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
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
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
  appUrl: process.env.APP_URL || "http://localhost:5173",
  ollama: {
    baseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(
      /\/+$/,
      ""
    ),
    model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 30000,
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "InternFlow <no-reply@internflow.local>",
  },
};
