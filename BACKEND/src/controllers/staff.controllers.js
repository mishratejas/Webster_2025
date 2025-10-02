import Staff from "../models/Staff.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const staffRegister =async(req,res)=>{
    try{
        const {name,email,password,phone,staffId}=req.body;
        if(!name || !email || !password || !staffId){
            return res.status(400).json({message:"Please fill all required fields for staff registration."})
        }
        const existingStaff = await Staff.findOne({$or:[{email},{staffId}]});
        if(existingStaff){
            return res.status(400).json({message:"Email or Staff ID already registered."});
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const newStaff=new Staff({
            name,
            email,
            password:hashedPassword,
            phone,
            staffId,
            role:"staff"
        });
        await newStaff.save();
        res.status(201).json({message:"Staff registered successfully. Awaiting admin approval."});
    }
    catch(err){
        console.error("Staff registration error:",err);
        res.status(500).json({message:"Server Error during staff registration"});
    }
};

export const staffLogin=async(req,res)=>{
    try{
        const {staffIdOrEmail,password}=req.body; 
        const staff=await Staff.findOne({
            $or:[{ email:staffIdOrEmail },{ staffId:staffIdOrEmail}], 
        });
        if(!staff){
            return res.status(404).json({ message: "Staff not found or Invalid Credentials" });
        }
        const isMatch=await bcrypt.compare(password,staff.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid Credentials" });
        } 
        const payload={ id:staff._id,role:staff.role||"staff"};
        const accessToken=jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn:"15m"});
        const refreshToken=jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn:"7d"});
        res.cookie("refreshToken", refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV==="production",
            sameSite: "strict",
            maxAge:7*24*60*60*1000, 
        });
        res.status(200).json({ 
            message:"Staff Login Successful", 
            accessToken,
            staff:{id:staff._id,name:staff.name,role:staff.role }
        });
    }
    catch(err){
        console.error("Staff Login Error:",err);
        res.status(500).json({ message:"Server Error during staff login." });
    }
};