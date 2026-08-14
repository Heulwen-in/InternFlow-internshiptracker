const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const noteRoutes = require("./routes/noteRoutes");
const taskRoutes = require("./routes/taskRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const dataRoutes = require("./routes/dataRoutes");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "512kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Internship Tracker API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", noteRoutes);
app.use("/api", taskRoutes);
app.use("/api", interviewRoutes);
app.use("/api", reminderRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", dataRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
