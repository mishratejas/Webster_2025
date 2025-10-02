import User from "../models/User.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//signup ke liye
export const userSignup=async(req,res)=>{
    try{
        const{name,email,password,phone,street,city,state,pincode}=req.body;

        if(!name || !email || !password || !phone){
            return res.status(400).json({ message: "Please fill all required fields: name, email, password, phone." });
        }

        //Check if user already exists
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"Email already registered"});
        }

        //Hash Password
        const hashedPassword=await bcrypt.hash(password,10);
        //create newUser
        const newUser=new User({
            name,
            email,
            password:hashedPassword,
            phone,
            address:{
                street,
                city,
                state,
                pincode,
            },
        });

        await newUser.save();

        res.status(201).json({message:"User registered successfully"});
    }
    catch(err){
        console.error("User Signup Error: ",err);
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message || "Validation failed for one or more fields." });
        }
        res.status(500).json({message:"Server Error"});
    }
};

//Login controller

export const userLogin=async(req,res)=>{
    try{
        const{email,password}=req.body;
        //Find user by email or phone
        const user=await User.findOne({
            $or:[{email:email},{phone:email}],
        });

        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }

        //Compare password
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        //Generate JWT
        const payload={id:user._id,role:user.role || "user"};

        const accessToken=jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});
        const refreshToken=jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"});

        //Send refresh token as HttpOnly cookie
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"strict",
            maxAge:7*24*60*60*1000, 
        });

        res.status(200).json({
            message:"Login Successful",
            accessToken,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role:user.role,
            },
        });
    }
    catch(err){
        console.error("User login error: ",err);
        res.status(500).json({message:"Server Error"});
    }
};