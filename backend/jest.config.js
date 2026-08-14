module.exports = {
  testEnvironment: "node",
  globalSetup: "./src/__tests__/globalSetup.js",
  setupFiles: ["./src/__tests__/setEnv.js"],
  setupFilesAfterEnv: ["./src/__tests__/teardownEach.js"],
  testMatch: ["**/src/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/__tests__/**",
    "!src/server.js",
  ],
  coverageThreshold: {
    global: { lines: 70 },
  },
};
