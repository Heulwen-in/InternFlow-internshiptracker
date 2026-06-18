// Runs before any module imports in every test file.
// dotenv.config() in env.js does NOT override already-set vars, so these win.
process.env.DATABASE_URL =
  "postgresql://internflow_user:internflow_password@localhost:5432/internflow_tracker_test";
process.env.JWT_SECRET =
  "test-secret-for-jest-that-is-at-least-32-characters-long";
process.env.NODE_ENV = "test";
