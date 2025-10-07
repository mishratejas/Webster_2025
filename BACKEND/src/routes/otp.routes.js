
import express from "express";
import {
    requestOTP,
    verifyOTP,
    userSignupWithOTP,
    userLoginWithOTP,
    staffLoginWithOTP,
    adminLoginWithOTP,
    requestPasswordResetOTP,
    resetPasswordWithOTP,
    resendOTP
} from "../controllers/otp.controllers.js";

const router = express.Router();

// Request OTP (for login/signup)
router.post("/request", requestOTP);

// Verify OTP
router.post("/verify", verifyOTP);

// Resend OTP
router.post("/resend", resendOTP);

// User Signup with OTP
router.post("/signup/user", userSignupWithOTP);

// User Login with OTP
router.post("/login/user", userLoginWithOTP);

// Staff Login with OTP
router.post("/login/staff", staffLoginWithOTP);

// Admin Login with OTP
router.post("/login/admin", adminLoginWithOTP);

// Password Reset - Request OTP
router.post("/password-reset/request", requestPasswordResetOTP);

// Password Reset - Verify and Reset
router.post("/password-reset/verify", resetPasswordWithOTP);

export default router;