const authService = require("../services/authService");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    console.error("[register] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    console.error("[login] error:", error);
    res.status(error.status || 500).json({ message: error.message || "Login failed" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body ?? {};
    const result = await authService.verifyEmail({ email, otp });
    res.json(result);
  } catch (error) {
    console.error("[verifyEmail] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Email verification failed" });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body ?? {};
    const result = await authService.resendVerification({ email });
    res.json(result);
  } catch (error) {
    console.error("[resendVerification] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to resend verification code" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {};
    const result = await authService.forgotPassword({ email });
    res.json(result);
  } catch (error) {
    console.error("[forgotPassword] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to send reset email" });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body ?? {};
    const result = await authService.validateResetToken({ token });
    res.json(result);
  } catch (error) {
    console.error("[validateResetToken] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "This link has been expired" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body ?? {};
    const result = await authService.resetPassword({ token, password });
    res.json(result);
  } catch (error) {
    console.error("[resetPassword] error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to reset password" });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getMe,
};
