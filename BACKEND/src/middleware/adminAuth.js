import jwt from "jsonwebtoken";
import Admin from "../models/Admin.models.js";
import { auth } from "./auth.js";

export const adminAuth=async(req,res,next)=>{
    try{
        const authHeader=req.header("Authorization");
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                success:false,
                message:"Access denied. No token provided."
            });
        }

        const token=authHeader.replace("Bearer ","");
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const admin=await Admin.findById(decoded.id).select("-password");

        if(!admin){
            return res.status(401).json({
                success:false,
                message:"Invalid token. Admin not found."
            });
        }

        if(!["admin","superadmin"].includes(admin.role)){
            return res.status(403).json({
                success:false,
                message:"Access denied. You are not an admin."
            });
        }
        req.admin=admin;
        next();
    }
    catch(error){
        console.error("Admin auth error:",error);
        res.status(401).json({
            success:false,
            message:"Unauthorized access."
        });
    }
};