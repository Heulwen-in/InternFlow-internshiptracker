const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getInterviews,
  getApplicationInterviews,
  createInterview,
  deleteInterview,
} = require("../controllers/interviewController");

const router = express.Router();

router.use(protect);

router.get("/interviews", getInterviews);
router.get("/applications/:applicationId/interviews", getApplicationInterviews);
router.post("/applications/:applicationId/interviews", createInterview);
router.delete("/interviews/:id", deleteInterview);

module.exports = router;