import Notification from "../models/Notification.models.js";
import notificationRoutes from "../utils/notificationHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Get all notifications for a user
export const getUserNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isRead, type, limit = 50, skip = 0 } = req.query;

    const query = { userId };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
    });

    res.status(200).json(
        new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched successfully")
    );
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

// Mark all notifications as read for a user
export const markAllAsRead = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );

    res.status(200).json(
        new ApiResponse(200, {}, "All notifications marked as read")
    );
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Notification deleted successfully")
    );
});

// Clear all notifications for a user
export const clearAllNotifications = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    await Notification.deleteMany({ userId });

    res.status(200).json(
        new ApiResponse(200, {}, "All notifications cleared")
    );
});

// Send custom notification (Admin/Staff use)
export const sendCustomNotification = asyncHandler(async (req, res) => {
    const { userId, type, message, subject } = req.body;

    if (!userId || !message) {
        throw new ApiError(400, "User ID and message are required");
    }

    await notificationRoutes(
        userId,
        type || "info",
        message,
        subject || "System Notification"
    );

    res.status(200).json(
        new ApiResponse(200, {}, "Notification sent successfully")
    );
});

// Send bulk notifications
export const sendBulkNotifications = asyncHandler(async (req, res) => {
    const { userIds, type, message, subject } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError(400, "User IDs array is required");
    }

    if (!message) {
        throw new ApiError(400, "Message is required");
    }

    const notificationPromises = userIds.map(userId =>
        notificationRoutes(
            userId,
            type || "info",
            message,
            subject || "System Notification"
        )
    );

    await Promise.allSettled(notificationPromises);

    res.status(200).json(
        new ApiResponse(200, {}, `Notifications sent to ${userIds.length} users`)
    );
});

// Get notification statistics
export const getNotificationStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const stats = await Notification.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
                unreadCount: {
                    $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                }
            }
        }
    ]);

    const totalCount = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
    });

    res.status(200).json(
        new ApiResponse(200, {
            total: totalCount,
            unread: unreadCount,
            byType: stats
        }, "Notification statistics fetched successfully")
    );
});