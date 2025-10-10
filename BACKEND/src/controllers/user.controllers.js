import User from "../models/User.models.js";
import OTP from "../models/otp.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//signup ke liye
export const userSignup = async (req, res) => {
    try {
        // 1. Get all data from the request body (from new controller)
        const { name, email, password, phone, street, city, state, pincode, otp } = req.body;

        // 2. Validate all required fields are present (from new controller)
        if (!name || !email || !password || !phone || !otp) {
            return res.status(400).json({ message: "Please fill all required fields, including OTP." });
        }

        // 3. Find the OTP record for verification (from new controller)
        const otpRecord = await OTP.findOne({
            identifier: email,
            purpose: 'signup',
            expiresAt: { $gt: new Date() } // Check if not expired
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid request. Please verify OTP first or your OTP has expired." });
        }

        // 4. Check OTP attempt limit (from new controller)
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
        }

        // 5. Compare the submitted OTP with the stored hash (from new controller)
        const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValidOTP) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` });
        }

        // 6. Check if user already exists (using the better $or query from new controller)
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: "Email or phone already registered" });
        }

        // 7. Hash password (from old controller)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. Create the new user using the structure from the old controller
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address: { // This ensures the nested address object is created correctly
                street,
                city,
                state,
                pincode,
            },
            isVerified: true // You can add this from your new schema if it exists
        });

        await newUser.save();

        // 9. IMPORTANT: Delete the OTP record after successful user creation (from new controller)
        await OTP.deleteOne({ _id: otpRecord._id });

        // 10. Generate tokens (from old controller)
        const payload = { id: newUser._id, role: newUser.role || "user" };
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        // 11. Send refresh token as a cookie (from old controller)
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // 12. Send the final JSON response in the format the frontend expects (from old controller)
        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                role: newUser.role,
            }
        });

    } catch (err) {
        console.error("User Signup Error: ", err);
        res.status(500).json({ message: "Server Error" });
    }
};
// export const userSignup = async (req, res) => {
//     try {
//         const { name, email, password, phone, street, city, state, pincode } = req.body;

//         if (!name || !email || !password || !phone) {
//             return res.status(400).json({ message: "Please fill all required fields: name, email, password, phone." });
//         }

//         //Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: "Email already registered" });
//         }

//         //Hash Password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         //create newUser
//         const newUser = new User({
//             name,
//             email,
//             password: hashedPassword,
//             phone,
//             address: {
//                 street,
//                 city,
//                 state,
//                 pincode,
//             },
//         });

//         await newUser.save();
//         // Generate tokens after signup
//         const payload = { id: newUser._id, role: newUser.role || "user" };
//         const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
//         const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

//         // Send refresh token as cookie
//         res.cookie("refreshToken", refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "strict",
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         res.status(201).json({
//             message: "User registered successfully",
//             accessToken, // ← ADD THIS
//             user: { // ← ADD THIS
//                 id: newUser._id,
//                 name: newUser.name,
//                 email: newUser.email,
//                 phone: newUser.phone,
//                 address: newUser.address,
//                 role: newUser.role,
//             }
//         });
//     }
//     catch (err) {
//         console.error("User Signup Error: ", err);
//         if (err.name === 'ValidationError') {
//             return res.status(400).json({ message: err.message || "Validation failed for one or more fields." });
//         }
//         res.status(500).json({ message: "Server Error" });
//     }
// };



//Login controller

export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        //Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: email }, { phone: email }],
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        //Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        //Generate JWT
        const payload = { id: user._id, role: user.role || "user" };

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        //Send refresh token as HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login Successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("User login error: ", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Refresh token controller
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new access token
        const payload = { id: user._id, role: user.role || "user" };
        const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

        res.json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error refreshing token"
        });
    }
};

// Logout controller
export const logout = (req, res) => {
    res.clearCookie("refreshToken");
    res.json({
        success: true,
        message: "Logged out successfully"
    });
};

//controller for user_profile
export const getUserProfile = async (req, res) => {
    try {
        // The 'auth' middleware has already found the user and attached it to req.user.
        // We just need to send it back. The password has already been removed by the middleware.
        const user = req.user;

        res.status(200).json({
            success: true,
            message: "Profile data fetched successfully",
            data: user
        });

    } catch (error) {
        console.error("Get User Profile Error: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

//for editing the user's details
export const updateUserProfile = async (req, res) => {
    try {
        // The user's ID is attached to the request by your auth middleware
        const userId = req.user.id; 

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get the fields from the request body
        const { name, phone, address, profileImage } = req.body;

        // Update only the fields that were provided in the request
        user.name = name || user.name;
        user.phone = phone || user.phone;

        // The profileImage will be a URL string from Cloudinary, sent by the frontend
        if (profileImage) {
            user.profileImage = profileImage;
        }

        // Update address fields if an address object is provided
        if (address) {
            user.address.street = address.street || user.address.street;
            user.address.city = address.city || user.address.city;
            user.address.state = address.state || user.address.state;
            user.address.pincode = address.pincode || user.address.pincode;
        }

        const updatedUser = await user.save();

        // Send back the updated user data (excluding the password)
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                profileImage: updatedUser.profileImage,
                createdAt: updatedUser.createdAt
            }
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Server error while updating profile" });
    }
};
