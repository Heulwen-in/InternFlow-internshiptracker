const prisma = require("../config/prisma");

const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch companies" });
  }
};

const getCompany = async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
      include: {
        applications: true,
      },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch company" });
  }
};

const createCompany = async (req, res) => {
  try {
    const { name, website, industry, location } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const company = await prisma.company.create({
      data: {
        userId: req.user.id,
        name,
        website,
        industry,
        location,
      },
    });

    res.status(201).json({ company });
  } catch (error) {
    res.status(500).json({ message: "Failed to create company" });
  }
};

const updateCompany = async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const { name, website, industry, location } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        name,
        website,
        industry,
        location,
      },
    });

    res.json({ company: updatedCompany });
  } catch (error) {
    res.status(500).json({ message: "Failed to update company" });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company._count.applications > 0) {
      return res.status(409).json({
        message: "Cannot delete a company that has applications",
      });
    }

    await prisma.company.delete({
      where: { id: company.id },
    });

    res.json({ message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete company" });
  }
};

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
};
