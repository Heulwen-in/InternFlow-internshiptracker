const prisma = require("../config/prisma");
const { toDate } = require("../utils/date");
const { createInterviewFollowUps } = require("../services/workflowService");

const getInterviews = async (req, res) => {
  try {
    const interviews = await prisma.interview.findMany({
      where: {
        application: { userId: req.user.id },
      },
      orderBy: { interviewDate: "asc" },
      include: {
        application: {
          include: { company: true },
        },
      },
    });

    res.json({ interviews });
  } catch {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

const getApplicationInterviews = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
      include: { company: true },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      orderBy: { interviewDate: "asc" },
    });

    res.json({ interviews });
  } catch {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

const createInterview = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { interviewDate, interviewType, meetingLink, notes } = req.body;

    if (!interviewDate) {
      return res.status(400).json({ message: "Interview date is required" });
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        interviewDate: toDate(interviewDate),
        interviewType,
        meetingLink,
        notes,
      },
    });

    await createInterviewFollowUps(application, interview);

    res.status(201).json({ interview });
  } catch {
    res.status(500).json({ message: "Failed to create interview" });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: {
        id: Number(req.params.id),
        application: { userId: req.user.id },
      },
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    await prisma.interview.delete({ where: { id: interview.id } });

    res.json({ message: "Interview deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete interview" });
  }
};

module.exports = {
  getInterviews,
  getApplicationInterviews,
  createInterview,
  deleteInterview,
};
