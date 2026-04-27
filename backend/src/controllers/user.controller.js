// src/controllers/user.controller.js
import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { PERMISSIONS, SENSITIVE_PERMISSIONS } from "../config/permissions.js";
import {
  encodePermissionsForRole,
  getEditablePermissions,
  getEffectivePermissions,
  normalizePermissionOverrides,
  normalizePermissions,
  normalizeRole,
} from "../utils/permissionResolver.js";

const sanitizeUser = (user) => {
  const permissions = getEditablePermissions(user.role, user.permissions);
  const permissionOverrides = normalizePermissionOverrides(user.permissions);

  return {
    ...user,
    permissionOverrides,
    permissions,
    effectivePermissions: getEffectivePermissions(user.role, user.permissions),
  };
};

const canManageSensitiveAccess = (actor) =>
  actor?.effectivePermissions?.includes("*") ||
  actor?.effectivePermissions?.includes(PERMISSIONS.MANAGE_ROLES);

const isSuperAdminActor = (actor) => normalizeRole(actor?.role) === "SUPER_ADMIN";

const normalizeUserStatus = (status) => {
  if (status === undefined || status === null || status === "") return null;
  const normalizedStatus = status.toString().trim().toLowerCase();
  return ["active", "inactive"].includes(normalizedStatus) ? normalizedStatus : null;
};

const validateAccessChange = (actor, role, permissions) => {
  const normalizedRole = role ? normalizeRole(role) : null;
  const normalizedPermissions = normalizePermissions(permissions);
  const touchesAdminRole = normalizedRole === "ADMIN";
  const touchesSensitiveRole = normalizedRole === "SUPER_ADMIN";
  const touchesSensitivePermission = normalizedPermissions.some((permission) =>
    SENSITIVE_PERMISSIONS.includes(permission),
  );

  if (touchesAdminRole && !isSuperAdminActor(actor)) {
    return "Only super admins can create admins or upgrade users to admin";
  }

  if ((touchesSensitiveRole || touchesSensitivePermission) && !canManageSensitiveAccess(actor)) {
    return "Only super admins can assign super-admin access or sensitive permissions";
  }

  return null;
};

// ------------------ ADMIN ROUTES ------------------

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: { select: { id: true, name: true } }
      }
    });
    res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions, status } = req.body;

    if (!role && permissions === undefined && status === undefined) {
      return res.status(400).json({ message: "Role, permissions, or status are required" });
    }

    const normalizedStatus = normalizeUserStatus(status);
    if (status !== undefined && !normalizedStatus) {
      return res.status(400).json({ message: "Status must be active or inactive" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { role: true, permissions: true },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetRole = role ?? existingUser.role;
    const targetPermissions =
      permissions !== undefined
        ? normalizePermissions(permissions)
        : getEditablePermissions(existingUser.role, existingUser.permissions);
    const accessError = validateAccessChange(req.user, targetRole, targetPermissions);
    if (accessError) {
      return res.status(403).json({ message: accessError });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(role ? { role: normalizeRole(role) } : {}),
        ...((permissions !== undefined || role)
          ? { permissions: encodePermissionsForRole(targetRole, targetPermissions) }
          : {}),
        ...(status !== undefined ? { status: normalizedStatus } : {}),
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE user (example for POST)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location, skill, permissions, status } = req.body; 

    const trimmedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);
    const normalizedPermissions = normalizePermissions(permissions);
    const normalizedStatus = normalizeUserStatus(status);

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    if (status !== undefined && !normalizedStatus) {
      return res.status(400).json({ message: "Status must be active or inactive" });
    }

    const accessError = validateAccessChange(req.user, normalizedRole, normalizedPermissions);
    if (accessError) {
      return res.status(403).json({ message: accessError });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        name: trimmedName, 
        email: normalizedEmail, 
        password: hashedPassword, 
        role: normalizedRole,
        permissions: encodePermissionsForRole(normalizedRole, normalizedPermissions),
        status: normalizedStatus || "active",
        phone: phone || null,        
        location: location || null,
        skill: skill || null
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Email already in use" });
      }
    }
    res.status(500).json({ message: error.message });
  }
};

// ------------------ LOGGED-IN USER ROUTES ------------------

// Get current logged-in user
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissionOverrides: normalizePermissionOverrides(user.permissions),
      permissions: getEditablePermissions(user.role, user.permissions),
      effectivePermissions: getEffectivePermissions(user.role, user.permissions),
      phone: user.phone || null,        
      location: user.location || null,
      skill: user.skill || null,
      team: user.team,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update current user's profile
export const updateCurrentUser = async (req, res) => {
  try {
    const { name, email, phone, location, skill } = req.body; 

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || user.name,
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone,        
        location: location !== undefined ? location : user.location,
        skill: skill !== undefined ? skill : user.skill
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      permissionOverrides: normalizePermissionOverrides(updatedUser.permissions),
      permissions: getEditablePermissions(updatedUser.role, updatedUser.permissions),
      effectivePermissions: getEffectivePermissions(updatedUser.role, updatedUser.permissions),
      phone: updatedUser.phone || null,        
      location: updatedUser.location || null,
      skill: updatedUser.skill || null,
      team: updatedUser.team,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
