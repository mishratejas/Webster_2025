import express from "express";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendCustomNotification,
    sendBulkNotifications,
    getNotificationStats
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get notifications for a user
router.get("/:userId", getUserNotifications);

// Get notification statistics
router.get("/:userId/stats", getNotificationStats);

// Mark single notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/:userId/read-all", markAllAsRead);

// Delete single notification
router.delete("/:id", deleteNotification);

// Clear all notifications
router.delete("/user/:userId", clearAllNotifications);

// Send custom notification (Admin/Staff only)
router.post("/send", sendCustomNotification);

// Send bulk notifications (Admin only)
router.post("/send-bulk", sendBulkNotifications);

export default router;