const prisma = require("../config/prisma");

const getNotes = async (req, res) => {
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
};

const createNote = async (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Note content is required" });
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
};

const deleteNote = async (req, res) => {
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
};

module.exports = { getNotes, createNote, deleteNote };