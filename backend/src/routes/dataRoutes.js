const express = require("express");
const protect = require("../middleware/requireAuth");
const {
  exportData,
  exportApplicationsCsv,
  importData,
} = require("../controllers/dataController");

const router = express.Router();

router.use(protect);

router.get("/data/export", exportData);
router.get("/data/export/applications.csv", exportApplicationsCsv);
router.post("/data/import", importData);

module.exports = router;
