ALTER TABLE "User"
ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenExpiry" TIMESTAMP(3);
