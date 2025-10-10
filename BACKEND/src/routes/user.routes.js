import express from "express";
import {userSignup,userLogin, refreshToken, logout,getUserProfile, updateUserProfile } from "../controllers/user.controllers.js";
import {auth} from "../middleware/auth.js"

const router =express.Router();

router.post("/signup",userSignup);
router.post("/login",userLogin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/profile", auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);

export default router;