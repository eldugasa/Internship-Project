import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://frontendprojecttaskmanagementsystem.vercel.app",
];

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS || "").length
    ? parseOrigins(process.env.ALLOWED_ORIGINS || "")
    : defaultAllowedOrigins,
  cookieSecure:
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production",
};

export const assertRequiredEnv = () => {
  const missing = [];

  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.refreshTokenSecret) missing.push("REFRESH_TOKEN_SECRET");

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
