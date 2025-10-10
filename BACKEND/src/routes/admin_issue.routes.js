import express from "express";
import { 
    handleFetchAllUserIssues, 
    handleFetchStaffList,      
    handleUpdateIssue,
    handleGetComplaintDetails,
    handleBulkAssign
} from "../controllers/admin_issue.controllers.js"; 
import {adminAuth} from "../middleware/adminAuth.js";

import {
  getComplaintChat,
  sendComplaintChat
} from "../controllers/admin_chat.controllers.js";

const router = express.Router();

router.get("/", adminAuth, handleFetchAllUserIssues); 

router.get("/staff", adminAuth, handleFetchStaffList); 

router.get("/:id", adminAuth, handleGetComplaintDetails);
router.put("/:id",adminAuth,handleUpdateIssue);
router.post("/bulk-assign",adminAuth,handleBulkAssign);
router.get("/:id/chat", adminAuth, getComplaintChat);
router.post("/:id/chat", adminAuth, sendComplaintChat);
export default router;