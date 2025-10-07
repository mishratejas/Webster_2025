import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import notificationRoutes from "../utils/notificationHandler.js";
import ChatMessage from "../models/chat.model.js";

// Helper function to generate conversation ID
const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
};

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, receiverModel, message, messageType = 'text', fileUrl } = req.body;
    const senderId = req.user.id; // From auth middleware
    const senderModel = req.user.role === 'admin' ? 'Admin' : 'Staff';

    if (!receiverId || !receiverModel || !message) {
        throw new ApiError(400, "Receiver ID, receiver model, and message are required");
    }

    const conversationId = generateConversationId(senderId, receiverId);

    const chatMessage = await ChatMessage.create({
        conversationId,
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        message,
        messageType,
        fileUrl
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id)
        .populate('senderId', 'name email profileImage')
        .populate('receiverId', 'name email profileImage');

    // Send real-time notification via Socket.IO
    if (global.io) {
        global.io.to(receiverId.toString()).emit('new_message', populatedMessage);
    }

    // Send push notification
    await notificationRoutes(
        receiverId,
        'new_message',
        `New message from ${req.user.name}`,
        'New Message Received'
    );

    res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message sent successfully")
    );
});

// Get conversation messages
export const getConversation = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const conversationId = generateConversationId(userId, otherUserId);

    const messages = await ChatMessage.find({
        conversationId,
        deletedBy: { $ne: userId }
    })
        .populate('senderId', 'name email profileImage role')
        .populate('receiverId', 'name email profileImage role')
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
        new ApiResponse(200, {
            messages: messages.reverse(),
            unreadCount,
            conversationId
        }, "Conversation fetched successfully")
    );
});

// Get all conversations for a user
export const getAllConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const conversations = await ChatMessage.aggregate([
        {
            $match: {
                $or: [
                    { senderId: mongoose.Types.ObjectId(userId) },
                    { receiverId: mongoose.Types.ObjectId(userId) }
                ],
                deletedBy: { $ne: mongoose.Types.ObjectId(userId) }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$$ROOT" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiverId", mongoose.Types.ObjectId(userId)] },
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
        {
            $sort: { "lastMessage.createdAt": -1 }
        }
    ]);

    // Populate sender and receiver details
    await ChatMessage.populate(conversations, [
        { path: 'lastMessage.senderId', select: 'name email profileImage role' },
        { path: 'lastMessage.receiverId', select: 'name email profileImage role' }
    ]);

    res.status(200).json(
        new ApiResponse(200, conversations, "Conversations fetched successfully")
    );
});

// Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await ChatMessage.updateMany(
        {
            conversationId,
            receiverId: userId,
            isRead: false
        },
        { isRead: true }
    );

    res.status(200).json(
        new ApiResponse(200, {}, "Messages marked as read")
    );
});

// Edit a message
export const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
        throw new ApiError(400, "Message content is required");
    }

    const chatMessage = await ChatMessage.findOne({
        _id: messageId,
        senderId: userId
    });

    if (!chatMessage) {
        throw new ApiError(404, "Message not found or unauthorized");
    }

    chatMessage.message = message;
    chatMessage.isEdited = true;
    await chatMessage.save();

    // Emit real-time update
    if (global.io) {
        global.io.to(chatMessage.conversationId).emit('message_edited', chatMessage);
    }

    res.status(200).json(
        new ApiResponse(200, chatMessage, "Message edited successfully")
    );
});

// Delete a message
export const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user.id;

    const chatMessage = await ChatMessage.findOne({
        _id: messageId,
        senderId: userId
    });

    if (!chatMessage) {
        throw new ApiError(404, "Message not found or unauthorized");
    }

    if (deleteForEveryone) {
        await ChatMessage.findByIdAndDelete(messageId);
        
        // Emit real-time update
        if (global.io) {
            global.io.to(chatMessage.conversationId).emit('message_deleted', { messageId });
        }
    } else {
        chatMessage.deletedBy.push(userId);
        await chatMessage.save();
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Message deleted successfully")
    );
});

// Search messages
export const searchMessages = asyncHandler(async (req, res) => {
    const { query, conversationId } = req.query;
    const userId = req.user.id;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    const searchFilter = {
        $or: [
            { senderId: userId },
            { receiverId: userId }
        ],
        message: { $regex: query, $options: 'i' },
        deletedBy: { $ne: userId }
    };

    if (conversationId) {
        searchFilter.conversationId = conversationId;
    }

    const messages = await ChatMessage.find(searchFilter)
        .populate('senderId', 'name email profileImage')
        .populate('receiverId', 'name email profileImage')
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json(
        new ApiResponse(200, messages, "Search results fetched successfully")
    );
});

// Get unread message count
export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const unreadCount = await ChatMessage.countDocuments({
        receiverId: userId,
        isRead: false,
        deletedBy: { $ne: userId }
    });

    res.status(200).json(
        new ApiResponse(200, { unreadCount }, "Unread count fetched successfully")
    );
});

export { ChatMessage };