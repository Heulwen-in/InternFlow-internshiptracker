const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("./db");

// Creates a fully-verified user directly in the DB (no email flow needed).
// Uses bcrypt cost 4 to keep unit tests fast.
async function makeVerifiedUser({
  name = "Test User",
  email = "test@example.com",
  password = "Password1!",
} = {}) {
  const passwordHash = await bcrypt.hash(password, 4);
  return prisma.user.create({
    data: { name, email, passwordHash, emailVerified: true },
  });
}

// Signs a JWT for a user object the same way the real authService does.
function makeToken(user) {
  return jwt.sign(
    { sub: user.id, userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

module.exports = { makeVerifiedUser, makeToken };
