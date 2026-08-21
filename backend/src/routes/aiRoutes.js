const express = require("express");
const protect = require("../middleware/requireAuth");
const { aiLimiter } = require("../middleware/rateLimiter");
const { parseJob } = require("../controllers/aiController");

const router = express.Router();

router.use(protect);
router.post("/parse-job", aiLimiter, parseJob);

module.exports = router;
