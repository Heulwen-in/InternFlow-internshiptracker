const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const result = await authService.register({ name, email, password });
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const result = await authService.login({ email, password });
  res.json(result);
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
