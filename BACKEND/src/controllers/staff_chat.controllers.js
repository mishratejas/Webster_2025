import ChatMessage from "../models/chat.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const generateConversationId = (userId1, userId2, complaintId = null) => {
  const baseId = [userId1, userId2].sort().join("_");
  return complaintId ? `${baseId}_${complaintId}` : baseId;
};

// GET chat for a complaint (staff perspective)
export const getComplaintChat = asyncHandler(async (req, res) => {
  const complaintId = req.params.id;
  const staffId = req.staff?._id;

  if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const messages = await ChatMessage.find({ complaintId: new mongoose.Types.ObjectId(complaintId) })
    .populate("senderId", "name role")
    .populate("receiverId", "name role")
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: messages });
});

// POST chat message (staff sends message)
export const sendComplaintChat = asyncHandler(async (req, res) => {
  const complaintId = req.params.id;
  const senderId = req.staff?._id;
  const senderRole = "Staff";
  const { message, receiverId } = req.body;

  if (!message || !receiverId) {
    return res.status(400).json({ success: false, message: "Message and receiverId are required" });
  }

  const conversationId = generateConversationId(senderId, receiverId, complaintId);

  const chatMessage = await ChatMessage.create({
    conversationId,
    senderId,
    senderModel: senderRole,
    receiverId,
    receiverModel: "Admin",
    message,
    complaintId: new mongoose.Types.ObjectId(complaintId),
  });

  if (global.io) global.io.to(receiverId.toString()).emit("new_message", chatMessage);

  res.status(201).json({ success: true, data: chatMessage });
});
