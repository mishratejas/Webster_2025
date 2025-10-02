import Admin from "../models/Admin.models.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const adminLogin=async(req,res) =>{
    try{
        // Frontend sends: adminId, password. We assume 'adminId' maps to 'email' for this model.
        // NOTE: If you want a specific 'adminId' field, we will add it to the Admin model.
        // For now, we will use 'email' to match the schema's unique field.
        const{ adminId,password } = req.body;
        
        // Find admin by email or phone (using adminId for the combined identifier, like the User login)
        const admin=await Admin.findOne({
            $or:[{ email:adminId },{phone:adminId }],
        });
        if(!admin) {
            return res.status(404).json({ message: "Admin not found or Invalid Credentials" });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        
        const payload={ id:admin._id,role:admin.role};
        const accessToken=jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        const refreshToken=jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        res.cookie("refreshToken", refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV==="production",
            sameSite:"strict",
            maxAge: 7*24*60*60*1000, 
        });
        res.status(200).json({ 
            message:"Admin Login Successful", 
            accessToken,
            admin:{ 
                id:admin._id, 
                name:admin.name, 
                email:admin.email,
                role:admin.role,
                permissions:admin.permissions 
            }
        });
    } catch(err){
        console.error("Admin Login Error:",err);
        res.status(500).json({ message:"Server Error during admin login." });
    }
};