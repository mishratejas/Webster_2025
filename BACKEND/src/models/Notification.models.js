import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The recipient ID (can be User, Staff, or Admin ObjectId)
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["info", "success", "warning", "error", "update", "new_complaint"], default: "info" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);