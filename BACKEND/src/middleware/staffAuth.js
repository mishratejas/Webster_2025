import jwt from "jsonwebtoken";
import Staff from "../models/Staff.models.js";

export const staffAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        console.log("Staff Auth - Header:",authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.replace("Bearer ", "");
        console.log("Staff Auth - Token:",token);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Staff Auth- Decoded:",decoded);

        const staffId=decoded.id || decoded.staffId || decoded._id || decoded.userId;
        console.log("Staff Auth - Looking for staff with ID:",staffId);
        if(!staffId){
            return res.status(401).json({
                success: false,
                message: "Invalid token structure."
            });
        }
        const staff = await Staff.findById(decoded.id).select("-password");
         console.log("Staff Auth - Found staff:", staff ? staff.name : "NOT FOUND");

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Staff not found."
            });
        }

        req.staff = staff;
        next();
    } catch (error) {
        console.error("Staff auth error:", error);
        res.status(401).json({
            success: false,
            message: "Unauthorized access."
        });
    }
};