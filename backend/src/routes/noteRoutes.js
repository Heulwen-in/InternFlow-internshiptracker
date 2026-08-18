const express = require("express");
const protect = require("../middleware/requireAuth");
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");

const router = express.Router();

router.use(protect);

router.get("/applications/:applicationId/notes", getNotes);
router.post("/applications/:applicationId/notes", createNote);
router.patch("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

module.exports = router;
