const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getNotes, createNote, deleteNote } = require("../controllers/noteController");

const router = express.Router();

router.use(protect);

router.get("/applications/:applicationId/notes", getNotes);
router.post("/applications/:applicationId/notes", createNote);
router.delete("/notes/:id", deleteNote);

module.exports = router;
