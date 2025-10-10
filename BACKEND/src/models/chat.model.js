import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Staff']
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Staff']
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserComplaint", // or "AdminComplaint" if chat is on admin complaint
      default: null,
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileUrl: String,
    isRead: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'deletedByModel'
    }],

     deletedByModel: {
      type: String,
      enum: ["Admin", "Staff"],
    },
}, { timestamps: true });

// Index for efficient queries
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ receiverId: 1, isRead: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);

