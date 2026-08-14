const dataService = require("../services/dataService");

const exportData = async (req, res) => {
  try {
    const payload = await dataService.exportData(req.user.id);
    res.json(payload);
  } catch (error) {
    console.error("[data.exportData]", error);
    res.status(500).json({ message: "Failed to export data" });
  }
};

const exportApplicationsCsv = async (req, res) => {
  try {
    const csv = await dataService.exportApplicationsCsv(req.user.id);
    res.type("text/csv").send(csv);
  } catch (error) {
    console.error("[data.exportApplicationsCsv]", error);
    res.status(500).json({ message: "Failed to export CSV" });
  }
};

const importData = async (req, res) => {
  try {
    const summary = await dataService.importData(req.user.id, req.body);
    res.json({ summary });
  } catch (error) {
    console.error("[data.importData]", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to import data" });
  }
};

module.exports = {
  exportData,
  exportApplicationsCsv,
  importData,
};
