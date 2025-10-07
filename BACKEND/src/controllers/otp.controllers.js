import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";
import OTP from "../models/otp.model.js";

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send OTP for Email
const sendOTPEmail = async (email, otp, purpose) => {
    const subject = purpose === 'signup' ? 'Verify Your Email - OTP' :
                   purpose === 'login' ? 'Login OTP Verification' :
                   purpose === 'password-reset' ? 'Password Reset OTP' :
                   'Email Verification OTP';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .otp-box { background: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
                .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>OTP Verification</h2>
                <p>Your One-Time Password (OTP) for ${purpose} is:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p>This OTP will expire in <strong>10 minutes</strong>.</p>
                <p class="warning">⚠️ Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
                <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
        </body>
        </html>
    `;

    await sendEmail(email, subject, `Your OTP is: ${otp}`, html);
};

// Send OTP for Phone
const sendOTPSMS = async (phone, otp, purpose) => {
    const message = `Your OTP for ${purpose} is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    await sendSMS(phone, message);
};

// Request OTP for Signup/Login
export const requestOTP = asyncHandler(async (req, res) => {
    const { identifier, type = 'email', purpose = 'login', userType = 'user' } = req.body;

    if (!identifier) {
        throw new ApiError(400, "Email or phone number is required");
    }

    // Validate identifier format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[0-9]{10}$/.test(identifier);

    if (!isEmail && !isPhone) {
        throw new ApiError(400, "Invalid email or phone number format");
    }

    // Check if user exists based on userType and purpose
    let userExists = false;
    if (userType === 'user') {
        userExists = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'staff') {
        userExists = await Staff.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'admin') {
        userExists = await Admin.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    }

    // For login, user must exist; for signup, user should not exist
    if (purpose === 'login' && !userExists) {
        throw new ApiError(404, "User not found. Please sign up first.");
    }

    if (purpose === 'signup' && userExists) {
        throw new ApiError(400, "User already exists. Please login instead.");
    }

    // Delete any existing OTP for this identifier
    await OTP.deleteMany({ identifier });

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Store OTP in database
    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: isEmail ? 'email' : 'phone',
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP based on type
    try {
        if (isEmail) {
            await sendOTPEmail(identifier, otp, purpose);
        } else if (isPhone) {
            await sendOTPSMS(identifier, otp, purpose);
        }
    } catch (error) {
        console.error("Failed to send OTP:", error);
        throw new ApiError(500, "Failed to send OTP. Please try again.");
    }

    res.status(200).json(
        new ApiResponse(200, { 
            identifier, 
            type: isEmail ? 'email' : 'phone',
            expiresIn: 600 
        }, "OTP sent successfully")
    );
});

// Verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
    const { identifier, otp, purpose = 'login' } = req.body;

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
        identifier,
        purpose,
        verified: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    // Check attempts limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json(
        new ApiResponse(200, { verified: true }, "OTP verified successfully")
    );
});

// User Signup with OTP
export const userSignupWithOTP = asyncHandler(async (req, res) => {
    const { name, email, password, phone, street, city, state, pincode, otp } = req.body;

    if (!name || !email || !password || !phone || !otp) {
        throw new ApiError(400, "All required fields must be filled");
    }

    // Verify OTP: allow inline verification if `otp` is provided, otherwise require a prior verified OTP
    const otpRecord = await OTP.findOne({
        identifier: email,
        purpose: 'signup',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    if (otp) {
        // check attempt limit
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
        }

        // mark verified
        otpRecord.verified = true;
        await otpRecord.save();
    } else if (!otpRecord.verified) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new ApiError(400, "Email or phone already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        address: { street, city, state, pincode },
        isVerified: true
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const payload = { id: newUser._id, role: newUser.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json(
        new ApiResponse(201, {
            accessToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        }, "User registered successfully")
    );
});

// User Login with OTP
export const userLoginWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    // Verify OTP: allow inline verification if `otp` is provided, otherwise require a prior verified OTP
    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    if (otp) {
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
        }

        otpRecord.verified = true;
        await otpRecord.save();
    } else if (!otpRecord.verified) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    // Find user
    const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        }, "Login successful")
    );
});

// Staff Login with OTP
export const staffLoginWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    if (otp) {
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
        }

        otpRecord.verified = true;
        await otpRecord.save();
    } else if (!otpRecord.verified) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    const staff = await Staff.findOne({
        $or: [{ email: identifier }, { phone: identifier }, { staffId: identifier }]
    });

    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const payload = { id: staff._id, role: 'staff' };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            staff: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                role: 'staff'
            }
        }, "Staff login successful")
    );
});

// Admin Login with OTP
export const adminLoginWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        throw new ApiError(400, "Identifier and OTP are required");
    }

    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'login',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    if (otp) {
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
        }

        otpRecord.verified = true;
        await otpRecord.save();
    } else if (!otpRecord.verified) {
        throw new ApiError(400, "Please verify OTP first or OTP has expired");
    }

    const admin = await Admin.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const payload = { id: admin._id, role: admin.role };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(
        new ApiResponse(200, {
            accessToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        }, "Admin login successful")
    );
});

// Password Reset - Request OTP
export const requestPasswordResetOTP = asyncHandler(async (req, res) => {
    const { identifier, userType = 'user' } = req.body;

    if (!identifier) {
        throw new ApiError(400, "Email or phone number is required");
    }

    let user;
    if (userType === 'user') {
        user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'staff') {
        user = await Staff.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    } else if (userType === 'admin') {
        user = await Admin.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete existing OTPs
    await OTP.deleteMany({ identifier, purpose: 'password-reset' });

    // Generate and send OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: user.email === identifier ? 'email' : 'phone',
        purpose: 'password-reset',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP
    if (user.email === identifier) {
        await sendOTPEmail(identifier, otp, 'password-reset');
    } else {
        await sendOTPSMS(identifier, otp, 'password-reset');
    }

    res.status(200).json(
        new ApiResponse(200, { identifier }, "Password reset OTP sent successfully")
    );
});

// Password Reset - Verify OTP and Reset Password
export const resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { identifier, otp, newPassword, userType = 'user' } = req.body;

    if (!identifier || !otp || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
        identifier,
        purpose: 'password-reset',
        expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, "Invalid OTP");
    }

    // Find and update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let user;

    if (userType === 'user') {
        user = await User.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    } else if (userType === 'staff') {
        user = await Staff.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    } else if (userType === 'admin') {
        user = await Admin.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { password: hashedPassword },
            { new: true }
        );
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
    const { identifier, purpose = 'login' } = req.body;

    if (!identifier) {
        throw new ApiError(400, "Identifier is required");
    }

    // Check if previous OTP was sent recently (prevent spam)
    const recentOTP = await OTP.findOne({
        identifier,
        purpose,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Within last minute
    });

    if (recentOTP) {
        throw new ApiError(429, "Please wait 60 seconds before requesting a new OTP");
    }

    // Delete existing OTPs
    await OTP.deleteMany({ identifier, purpose });

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    await OTP.create({
        identifier,
        otp: hashedOTP,
        type: isEmail ? 'email' : 'phone',
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP
    if (isEmail) {
        await sendOTPEmail(identifier, otp, purpose);
    } else {
        await sendOTPSMS(identifier, otp, purpose);
    }

    res.status(200).json(
        new ApiResponse(200, { identifier }, "OTP resent successfully")
    );
});  

