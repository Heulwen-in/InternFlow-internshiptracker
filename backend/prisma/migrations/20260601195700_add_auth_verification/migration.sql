-- Add auth verification and password reset fields
ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerificationOtpHash" TEXT,
ADD COLUMN "emailVerificationOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetTokenExpiresAt" TIMESTAMP(3);

-- Preserve access for accounts created before email verification existed.
UPDATE "User" SET "emailVerified" = true;
