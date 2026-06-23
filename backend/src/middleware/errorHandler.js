const env = require("../config/env");

// 404 handler — mount AFTER all routes.
function notFound(_req, res, _next) {
  res.status(404).json({ error: "Not Found" });
}

// Central error handler — mount LAST.
// Express 5 forwards thrown errors from async handlers here automatically.
function errorHandler(err, _req, res, _next) {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body is too large. Try a smaller avatar image.",
    });
  }

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;

  if (status >= 500) {
    console.error("[error]", err);
  }

  const body = { error: err.message || "Internal Server Error" };
  if (env.nodeEnv !== "production" && err.stack) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
