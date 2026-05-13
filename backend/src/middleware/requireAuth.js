const prisma = require("../config/prisma");
const authService = require("../services/authService");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

module.exports = asyncHandler(async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Missing Bearer token");
  }

  const payload = authService.verifyToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new HttpError(401, "User no longer exists");
  }

  req.user = authService.publicUser(user);
  next();
});
