import express from "express";
import {userSignup,userLogin, refreshToken, logout} from "../controllers/user.controllers.js";

const router =express.Router();

router.post("/signup",userSignup);
router.post("/login",userLogin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;