import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("ADMIN"),
  getAdminDashboard
);

export default router;
