const express = require("express");
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getMe,
} = require("../controllers/authController");
const {
  updateProfile,
  changePassword,
  getProfileStats,
} = require("../controllers/profileController");
const requireAuth = require("../middleware/requireAuth");
const { authLimiter, strictLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", strictLimiter, login);
router.post("/verify-email", strictLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/validate-reset-token", authLimiter, validateResetToken);
router.post("/reset-password", strictLimiter, resetPassword);
router.get("/me", requireAuth, getMe);
router.get("/profile/stats", requireAuth, getProfileStats);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/password", requireAuth, strictLimiter, changePassword);

module.exports = router;
