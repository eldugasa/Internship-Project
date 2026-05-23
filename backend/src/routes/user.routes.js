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
  updateCurrentUser,
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  changePasswordValidation,
  createUserValidation,
  updateCurrentUserValidation,
  updateUserAccessValidation,
} from "../validation/user.validation.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireAnyPermission(PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_TEAMS),
  getAllUsers,
);

router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  createUserValidation,
  validateRequest,
  createUser,
);

router.put(
  "/:id/role",
  authenticate,
  requireAnyPermission(PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ROLES),
  updateUserAccessValidation,
  validateRequest,
  updateUserRole,
);

router.get("/me", authenticate, getMe);

router.put(
  "/me/profile",
  authenticate,
  updateCurrentUserValidation,
  validateRequest,
  updateCurrentUser,
);

router.put(
  "/me/password",
  authenticate,
  changePasswordValidation,
  validateRequest,
  changePassword,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  deleteUser,
);

export default router;
