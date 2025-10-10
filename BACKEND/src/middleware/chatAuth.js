import jwt from "jsonwebtoken";
import Admin from "../models/Admin.models.js";
import Staff from "../models/Staff.models.js";

export const chatAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Try to find user in Admin collection
        let user = await Admin.findById(decoded.id).select("-password");
        let userType = "admin";

        // If not found in Admin, try Staff collection
        if (!user) {
            user = await Staff.findById(decoded.id).select("-password");
            userType = "staff";
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found."
            });
        }

        // Add user and type to request
        req.user = user;
        req.userType = userType;

        console.log(`Chat Auth - ${userType.toUpperCase()} authenticated:`, user.name);
        next();
    } catch (error) {
        console.error("Chat auth error:", error);
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please refresh your token."
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error in authentication."
        });
    }
};