import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'phone', 'both'],
        required: true
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'password-reset', 'verification'],
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5
    },
    userType: {
        type: String,
        enum: ['user', 'staff', 'admin'],
        default: 'user'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto-deletes expired documents
    }
}, { timestamps: true });

// Compound index for efficient queries
otpSchema.index({ identifier: 1, purpose: 1, verified: 1 });

export default mongoose.model('OTP', otpSchema);