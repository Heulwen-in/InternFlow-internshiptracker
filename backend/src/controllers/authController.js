const authService = require("../services/authService");

function sendError(res, error, fallbackMessage, context) {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(`[${context}] error:`, error);
  }
  return res.status(status).json({ message: error.message || fallbackMessage });
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error, "Registration failed", "register");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    sendError(res, error, "Login failed", "login");
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body ?? {};
    const result = await authService.verifyEmail({ email, otp });
    res.json(result);
  } catch (error) {
    sendError(res, error, "Email verification failed", "verifyEmail");
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body ?? {};
    const result = await authService.resendVerification({ email });
    res.json(result);
  } catch (error) {
    sendError(res, error, "Failed to resend verification code", "resendVerification");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {};
    const result = await authService.forgotPassword({ email });
    res.json(result);
  } catch (error) {
    sendError(res, error, "Failed to send reset email", "forgotPassword");
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body ?? {};
    const result = await authService.validateResetToken({ token });
    res.json(result);
  } catch (error) {
    sendError(res, error, "This link has been expired", "validateResetToken");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body ?? {};
    const result = await authService.resetPassword({ token, password });
    res.json(result);
  } catch (error) {
    sendError(res, error, "Failed to reset password", "resetPassword");
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
