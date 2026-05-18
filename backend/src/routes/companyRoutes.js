const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

const router = express.Router();

router.use(protect);

router.get("/", getCompanies);
router.post("/", createCompany);
router.get("/:id", getCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

module.exports = router;