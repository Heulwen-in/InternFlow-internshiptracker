const prisma = require("../config/prisma");

const getNotes = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const notes = await prisma.note.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (error) {
    console.error("[notes.getNotes]", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

const createNote = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Note content is required" });
    }
    if (content.length > 10000) {
      return res.status(400).json({ message: "Note content must be 10,000 characters or fewer" });
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const note = await prisma.note.create({
      data: { applicationId, content },
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error("[notes.createNote]", error);
    res.status(500).json({ message: "Failed to create note" });
  }
};

const updateNote = async (req, res) => {
  try {
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ message: "Note content is required" });
    }
    if (content.length > 10000) {
      return res
        .status(400)
        .json({ message: "Note content must be 10,000 characters or fewer" });
    }

    const note = await prisma.note.findFirst({
      where: {
        id: Number(req.params.id),
        application: { userId: req.user.id },
      },
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const updatedNote = await prisma.note.update({
      where: { id: note.id },
      data: { content },
    });

    res.json({ note: updatedNote });
  } catch (error) {
    console.error("[notes.updateNote]", error);
    res.status(500).json({ message: "Failed to update note" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: Number(req.params.id),
        application: { userId: req.user.id },
      },
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.delete({ where: { id: note.id } });

    res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("[notes.deleteNote]", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
