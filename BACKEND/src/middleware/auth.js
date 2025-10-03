import jwt from "jsonwebtoken";
import User from "../models/User.models.js";

export const auth = async (req, res, next) => {
    try {
        // Get token from Authorization header (Bearer token)
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                success: false,
                message: "Access denied. No token provided." 
            });
        }

        const token = authHeader.replace("Bearer ", "");

        // Verify access token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find user
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found."
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        
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

// Optional: Middleware to check if user is authenticated via cookie (for refresh token)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // If auth fails, just continue without user (public access)
        next();
    }
};