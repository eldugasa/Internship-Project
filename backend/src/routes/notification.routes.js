import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../controllers/notification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get notifications for current user
router.get("/", getMyNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get("/unread-count", getUnreadCount);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put("/:id/read", markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", deleteNotification);

export default router;