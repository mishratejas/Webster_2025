import ChatMessage from "../models/chat.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const generateConversationId = (userId1, userId2, complaintId = null) => {
  const baseId = [userId1, userId2].sort().join("_");
  return complaintId ? `${baseId}_${complaintId}` : baseId;
};

// GET chat messages for a complaint
export const getComplaintChat = asyncHandler(async (req, res) => {
  const complaintId = req.params.id;
  const adminId = req.admin._id;

  const messages = await ChatMessage.find({ complaintId: new mongoose.Types.ObjectId(complaintId) })
    .populate("senderId", "name role")
    .populate("receiverId", "name role")
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: messages });
});

// POST/send a message for a complaint
export const sendComplaintChat = asyncHandler(async (req, res) => {
  const complaintId = req.params.id;
  const adminId = req.admin._id;
  const { message, receiverId } = req.body;

  if (!message || !receiverId) {
    return res.status(400).json({ success: false, message: "Message and receiverId required" });
  }

  const conversationId = generateConversationId(adminId, receiverId, complaintId);

  const chatMessage = await ChatMessage.create({
    conversationId,
    senderId: adminId,
    senderModel: "Admin",
    receiverId,
    receiverModel: "Staff",
    message,
    complaintId: new mongoose.Types.ObjectId(complaintId),
  });

  res.status(201).json({ success: true, data: chatMessage });
});
