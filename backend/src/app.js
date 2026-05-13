const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Internship Tracker API is running" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
