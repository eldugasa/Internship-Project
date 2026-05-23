import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const buildAuthPayload = (user = {}) => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

export const generateAccessToken = (user) =>
  jwt.sign(buildAuthPayload(user), env.jwtSecret, {
    expiresIn: env.accessTokenTtl,
  });

export const generateRefreshToken = (user) =>
  jwt.sign(buildAuthPayload(user), env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwtSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.refreshTokenSecret);
