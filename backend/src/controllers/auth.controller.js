import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { createNotification } from "../utils/notificationHelper.js";
import {
  getEditablePermissions,
  getEffectivePermissions,
  normalizePermissionOverrides,
} from "../utils/permissionResolver.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "../utils/authCookies.js";

const normalizeEmail = (email = "") => email.toString().trim().toLowerCase();

const buildAuthUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  permissionOverrides: normalizePermissionOverrides(user.permissions),
  permissions: getEditablePermissions(user.role, user.permissions),
  effectivePermissions: getEffectivePermissions(user.role, user.permissions),
});

const persistRefreshToken = async (userId, refreshToken) => {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
};

const establishSession = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await persistRefreshToken(user.id, refreshToken);
  setAuthCookies(res, { accessToken, refreshToken });
};

const clearStoredSession = async (userId) => {
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiry: null,
    },
  });
};

const register = async (_req, res) =>
  res.status(403).json({
    message: "Self-signup is disabled. Contact an admin to create your account.",
  });

const login = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "This account is inactive. Contact an admin." });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await establishSession(res, user);

    return res.json({
      user: buildAuthUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Failed to log in" });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiry) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session not found" });
    }

    if (user.refreshTokenExpiry < new Date()) {
      await clearStoredSession(user.id);
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session expired" });
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) {
      await clearStoredSession(user.id);
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    await establishSession(res, user);

    return res.json({
      user: buildAuthUser(user),
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Failed to refresh session" });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        await clearStoredSession(decoded.id);
      } catch {
        // Ignore invalid refresh token during logout; cookies will still be cleared.
      }
    }

    clearAuthCookies(res);
    return res.status(204).send();
  } catch (err) {
    console.error("Logout error:", err);
    clearAuthCookies(res);
    return res.status(204).send();
  }
};

const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(200).json({
        message: "If an account exists with this email, you will receive a password reset link",
      });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret + user.password,
      { expiresIn: "1h" },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
    }

    try {
      await createNotification({
        userId: user.id,
        type: "password_reset",
        title: "Password Reset Requested",
        message: "A password reset link has been sent to your email",
        data: { email: user.email },
      });
    } catch (notifErr) {
      console.error("Error creating notification:", notifErr);
    }

    return res.status(200).json({
      message: "If an account exists with this email, you will receive a password reset link",
      ...(env.nodeEnv === "development" && { resetToken }),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Failed to process password reset request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.decode(token);
    if (!decoded?.id) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetToken !== token) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: "Reset link has expired" });
    }

    try {
      jwt.verify(token, env.jwtSecret + user.password);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ message: "Reset link has expired" });
      }
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      },
    });

    clearAuthCookies(res);

    try {
      await createNotification({
        userId: user.id,
        type: "password_changed",
        title: "Password Changed Successfully",
        message: "Your password has been updated",
        data: { timestamp: new Date().toISOString() },
      });
    } catch (notifErr) {
      console.error("Error creating notification:", notifErr);
    }

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

export { register, login, refresh, logout, forgotPassword, resetPassword };
