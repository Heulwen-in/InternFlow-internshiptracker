const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

const router = express.Router();

router.use(protect);

router.get("/", getApplications);
router.post("/", createApplication);
router.get("/:id", getApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;