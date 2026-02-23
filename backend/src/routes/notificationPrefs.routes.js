import express from 'express';
import authenticate from "../middleware/auth.middleware.js";
import { 
  getNotificationPrefs, 
  updateNotificationPrefs,
  resetNotificationPrefs 
} from '../controllers/notificationPrefs.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's notification preferences
router.get('/', getNotificationPrefs);

// Update notification preferences
router.put('/', updateNotificationPrefs);

// Reset to default preferences
router.post('/reset', resetNotificationPrefs);

export default router;