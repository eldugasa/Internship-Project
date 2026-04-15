// src/controllers/user.controller.js
import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const normalizeRole = (role = "TEAM_MEMBER") =>
  role.toString().trim().toUpperCase().replace(/-/g, "_");

// ------------------ ADMIN ROUTES ------------------

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: { select: { id: true, name: true } }
      }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: normalizeRole(role) },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE user (example for POST)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location, skill } = req.body; 

    const trimmedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

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
        phone: phone || null,        
        location: location || null,
        skill: skill || null
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(user);
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
