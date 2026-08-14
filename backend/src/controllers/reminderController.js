const reminderService = require("../services/reminderService");

const getNotifications = async (req, res) => {
  try {
    const result = await reminderService.listNotifications(req.user.id);
    res.json(result);
  } catch (error) {
    console.error("[reminders.getNotifications]", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to load notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const result = await reminderService.markNotificationRead(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error("[reminders.markNotificationRead]", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to update notification" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await reminderService.markAllNotificationsRead(req.user.id);
    res.json(result);
  } catch (error) {
    console.error("[reminders.markAllNotificationsRead]", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to update notifications" });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
