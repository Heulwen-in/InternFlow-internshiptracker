const prisma = require("../config/prisma");

const toDate = (value) => {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
};

const getApplications = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
      include: { company: true },
    });

    res.json({ applications });
  } catch (error) {
    console.error("[applications.getApplications]", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

const getApplication = async (req, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
      include: {
        company: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ application });
  } catch (error) {
    console.error("[applications.getApplication]", error);
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

const createApplication = async (req, res) => {
  try {
    const {
      companyId,
      roleTitle,
      jobUrl,
      location,
      workType,
      status,
      appliedDate,
      deadline,
      priority,
    } = req.body;

    if (!companyId || !roleTitle) {
      return res.status(400).json({
        message: "Company and role title are required",
      });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: Number(companyId),
        userId: req.user.id,
      },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const application = await prisma.application.create({
      data: {
        userId: req.user.id,
        companyId: company.id,
        roleTitle,
        jobUrl,
        location,
        workType,
        status: status || "Saved",
        appliedDate: toDate(appliedDate),
        deadline: toDate(deadline),
        priority,
        statusHistory: {
          create: {
            oldStatus: null,
            newStatus: status || "Saved",
          },
        },
      },
      include: {
        company: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    res.status(201).json({ application });
  } catch (error) {
    console.error("[applications.createApplication]", error);
    res.status(500).json({ message: "Failed to create application" });
  }
};

const updateApplication = async (req, res) => {
  try {
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const {
      companyId,
      roleTitle,
      jobUrl,
      location,
      workType,
      status,
      appliedDate,
      deadline,
      priority,
    } = req.body;

    let nextCompanyId = undefined;

    if (companyId !== undefined) {
      const company = await prisma.company.findFirst({
        where: {
          id: Number(companyId),
          userId: req.user.id,
        },
      });

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      nextCompanyId = company.id;
    }

    const statusChanged = status !== undefined && status !== existingApplication.status;

    const application = await prisma.application.update({
      where: { id: existingApplication.id },
      data: {
        companyId: nextCompanyId,
        roleTitle,
        jobUrl,
        location,
        workType,
        status,
        appliedDate: toDate(appliedDate),
        deadline: toDate(deadline),
        priority,
        statusHistory: statusChanged
          ? {
              create: {
                oldStatus: existingApplication.status,
                newStatus: status,
              },
            }
          : undefined,
      },
      include: {
        company: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    res.json({ application });
  } catch (error) {
    console.error("[applications.updateApplication]", error);
    res.status(500).json({ message: "Failed to update application" });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    await prisma.$transaction([
      prisma.task.updateMany({ 
        where: { applicationId: application.id }, data: { applicationId: null } 
      }),
      prisma.note.deleteMany({
        where: { applicationId: application.id },
      }),
      prisma.interview.deleteMany({
        where: { applicationId: application.id },
      }),
      prisma.statusHistory.deleteMany({
        where: { applicationId: application.id },
      }),
      prisma.application.delete({
        where: { id: application.id },
      }),
    ]);

    res.json({ message: "Application deleted" });
  } catch (error) {
    console.error("[applications.deleteApplication]", error);
    res.status(500).json({ message: "Failed to delete application" });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};
