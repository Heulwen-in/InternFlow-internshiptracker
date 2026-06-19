const profileService = require("../services/profileService");

const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error("[updateProfile] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to update profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await profileService.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error("[changePassword] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to change password" });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const stats = await profileService.getProfileStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error("[getProfileStats] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to load profile stats" });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  getProfileStats,
};
