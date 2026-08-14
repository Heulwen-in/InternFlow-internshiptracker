const analyticsService = require("../services/analyticsService");

const getOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getOverview(req.user.id);
    res.json({ overview });
  } catch (error) {
    console.error("[analytics.getOverview]", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

module.exports = { getOverview };
