import express from "express";
import { staffRegister,staffLogin } from "../controllers/staff.controllers.js";
const router=express.Router();

router.post("/register",staffRegister);
router.post("/login",staffLogin);
export default router;