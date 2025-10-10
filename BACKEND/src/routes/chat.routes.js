import express from "express";
import {
    sendMessage,
    getConversation,
    getAllConversations,
    markMessagesAsRead,
    editMessage,
    deleteMessage,
    searchMessages,
    getUnreadCount
} from "../controllers/chat.controllers.js";
import { chatAuth } from "../middleware/chatAuth.js";

const router = express.Router();

// All chat routes require authentication
router.use(chatAuth);

// Send a message
router.post("/send", sendMessage);

// Get all conversations for logged-in user
router.get("/conversations", getAllConversations);

// Get conversation with specific user
router.get("/conversation/:otherUserId", getConversation);

// Mark conversation messages as read
router.patch("/conversation/:conversationId/read", markMessagesAsRead);

// Edit a message
router.patch("/message/:messageId/edit", editMessage);

// Delete a message
router.delete("/message/:messageId/delete", deleteMessage);

// Search messages
router.get("/search", searchMessages);

// Get unread message count
router.get("/unread-count", getUnreadCount);

export default router;