const express = require("express");
const protect = require("../middleware/requireAuth");
const { getOverview } = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);

router.get("/analytics/overview", getOverview);

module.exports = router;
