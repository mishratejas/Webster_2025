import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import notificationRoutes from "../utils/notificationHandler.js";
import ChatMessage from "../models/chat.model.js";

// Helper to create consistent conversation IDs
const generateConversationId = (userId1, userId2, complaintId = null) => {
    const baseId = [userId1, userId2].sort().join("_");
    return complaintId ? `${baseId}_${complaintId}` : baseId;
};

// ===========================
// 🔹 SEND MESSAGE
// ===========================
export const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, message, messageType = "text", fileUrl, complaintId } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role === "admin" ? "Admin" : "Staff";

    // ✅ Allow only Admin <-> Staff chats
    if (req.user.role !== "admin" && req.user.role !== "staff") {
        throw new ApiError(403, "Only Admin and Staff can use chat");
    }

    if (!receiverId || !message) {
        throw new ApiError(400, "Receiver ID and message are required");
    }

    const receiverModel = req.user.role === "admin" ? "Staff" : "Admin";
    const conversationId = generateConversationId(senderId, receiverId, complaintId);

    const chatMessage = await ChatMessage.create({
        conversationId,
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        message,
        messageType,
        fileUrl,
        complaintId: complaintId ? new mongoose.Types.ObjectId(complaintId) : null
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id)
        .populate("senderId", "name email profileImage role")
        .populate("receiverId", "name email profileImage role");

    // 🔔 Real-time message delivery
    if (global.io) {
        global.io.to(receiverId.toString()).emit("new_message", populatedMessage);
    }

    // 🔔 Optional notification
    await notificationRoutes(
        receiverId,
        "new_message",
        `New message from ${req.user.name}`,
        "New Message Received"
    );

    res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent successfully"));
});

// ===========================
// 🔹 GET CONVERSATION (with optional complaint filter)
// ===========================
export const getConversation = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;
    const { complaintId } = req.query;
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const conversationId = generateConversationId(userId, otherUserId, complaintId);

    const messages = await ChatMessage.find({
        conversationId,
        deletedBy: { $ne: userId }
    })
        .populate("senderId", "name email profileImage role")
        .populate("receiverId", "name email profileImage role")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

    const unreadCount = await ChatMessage.countDocuments({
        conversationId,
        receiverId: userId,
        isRead: false,
        deletedBy: { $ne: userId }
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                messages: messages.reverse(),
                unreadCount,
                conversationId,
                complaintId: complaintId || null
            },
            "Conversation fetched successfully"
        )
    );
});

// ===========================
// 🔹 GET ALL CONVERSATIONS (optionally grouped by complaintId)
// ===========================
export const getAllConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const conversations = await ChatMessage.aggregate([
        {
            $match: {
                $or: [
                    { senderId: new mongoose.Types.ObjectId(userId) },
                    { receiverId: new mongoose.Types.ObjectId(userId) }
                ],
                deletedBy: { $ne: new mongoose.Types.ObjectId(userId) }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$$ROOT" },
                complaintId: { $first: "$complaintId" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ["$isRead", false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        { $sort: { "lastMessage.createdAt": -1 } }
    ]);

    await ChatMessage.populate(conversations, [
        { path: "lastMessage.senderId", select: "name email profileImage role" },
        { path: "lastMessage.receiverId", select: "name email profileImage role" },
        { path: "complaintId", select: "title status" } // optional populate if linked
    ]);

    res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
});

// ===========================
// 🔹 REMAINING FUNCTIONS SAME
// ===========================
export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await ChatMessage.updateMany(
        { conversationId, receiverId: userId, isRead: false },
        { isRead: true }
    );

    res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

export const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chatMessage = await ChatMessage.findOne({ _id: messageId, senderId: userId });
    if (!chatMessage) throw new ApiError(404, "Message not found or unauthorized");

    chatMessage.message = message;
    chatMessage.isEdited = true;
    await chatMessage.save();

    if (global.io) {
        global.io.to(chatMessage.conversationId).emit("message_edited", chatMessage);
    }

    res.status(200).json(new ApiResponse(200, chatMessage, "Message edited successfully"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user.id;

    const chatMessage = await ChatMessage.findOne({ _id: messageId });
    if (!chatMessage) throw new ApiError(404, "Message not found");

    if (deleteForEveryone && chatMessage.senderId.toString() === userId.toString()) {
        await ChatMessage.findByIdAndDelete(messageId);
        if (global.io) {
            global.io.to(chatMessage.conversationId).emit("message_deleted", {
                messageId,
                conversationId: chatMessage.conversationId
            });
        }
    } else {
        chatMessage.deletedBy.push(userId);
        await chatMessage.save();
    }

    res.status(200).json(new ApiResponse(200, {}, "Message deleted successfully"));
});

export const searchMessages = asyncHandler(async (req, res) => {
    const { query, complaintId } = req.query;
    const userId = req.user.id;

    if (!query) throw new ApiError(400, "Search query is required");

    const filter = {
        $or: [{ senderId: userId }, { receiverId: userId }],
        message: { $regex: query, $options: "i" },
        deletedBy: { $ne: userId }
    };

    if (complaintId) filter.complaintId = new mongoose.Types.ObjectId(complaintId);

    const messages = await ChatMessage.find(filter)
        .populate("senderId", "name email profileImage")
        .populate("receiverId", "name email profileImage")
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json(new ApiResponse(200, messages, "Search results fetched successfully"));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const unreadCount = await ChatMessage.countDocuments({
        receiverId: userId,
        isRead: false,
        deletedBy: { $ne: userId }
    });

    res.status(200).json(new ApiResponse(200, { unreadCount }, "Unread count fetched successfully"));
});

export { ChatMessage };
