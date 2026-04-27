// src/routes/user.routes.js
import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  getMe,
  updateCurrentUser, // ✅ fixed name
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// -------------------- Admin Endpoints --------------------

// Get all users (Admin and Project Manager)
router.get(
  "/",
  authenticate,
  requireAnyPermission(PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_TEAMS),
  getAllUsers,
);

// Create a new user (Admin only)
router.post("/", authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), createUser);

// Update a user's role (Admin only)
router.put(
  "/:id/role",
  authenticate,
  requireAnyPermission(PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ROLES),
  updateUserRole,
);

// -------------------- Logged-in User Endpoints --------------------

// Get logged-in user info
router.get("/me", authenticate, getMe);

// Update logged-in user's profile
router.put("/me/profile", authenticate, updateCurrentUser); // ✅ fixed here

// Change logged-in user's password
router.put("/me/password", authenticate, changePassword);

router.delete("/:id", authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), deleteUser); // to delete user....

export default router;
