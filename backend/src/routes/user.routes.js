// src/routes/user.routes.js
import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  getMe,
  updateCurrentUser,   // ✅ fixed name
  changePassword, 
  deleteUser
} from "../controllers/user.controller.js";

const router = express.Router();

// -------------------- Admin Endpoints --------------------



// Get all users (Admin only)
router.get("/", authenticate, authorize("ADMIN"), getAllUsers);

// Create a new user (Admin only)
router.post("/", authenticate, authorize("ADMIN"), createUser);

// Update a user's role (Admin only)
router.put("/:id/role", authenticate, authorize("ADMIN"), updateUserRole);

// -------------------- Logged-in User Endpoints --------------------

// Get logged-in user info
router.get("/me", authenticate, getMe);

// Update logged-in user's profile
router.put("/me/profile", authenticate, updateCurrentUser); // ✅ fixed here

// Change logged-in user's password
router.put("/me/password", authenticate, changePassword);

router.delete("/:id", authenticate, authorize("ADMIN"), deleteUser); // to delete user....

export default router;
