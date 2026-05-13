const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

const SALT_ROUNDS = 12;
const TOKEN_TTL = "7d";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: TOKEN_TTL,
  });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new HttpError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
  });

  return { user: publicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Constant-ish behaviour: still hash-compare on a dummy hash when user missing,
  // so timing leaks less info about which emails exist.
  const validPassword = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvaliduO");

  if (!user || !validPassword) {
    throw new HttpError(401, "Invalid email or password");
  }

  return { user: publicUser(user), token: signToken(user) };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

module.exports = { register, login, verifyToken, publicUser };
