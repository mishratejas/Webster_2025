import express from "express";
import { 
    handleFetchAllUserIssues, 
    handleFetchStaffList,      
    handleUpdateIssue,
    handleGetComplaintDetails,
    handleBulkAssign
} from "../controllers/admin_issue.controllers.js"; 
import {adminAuth} from "../middleware/adminAuth.js";
const router = express.Router();

router.get("/", adminAuth, handleFetchAllUserIssues); 

router.get("/staff", adminAuth, handleFetchStaffList); 

router.get("/:id", adminAuth, handleGetComplaintDetails);
router.put("/:id",adminAuth,handleUpdateIssue);
router.post("/bulk-assign",adminAuth,handleBulkAssign);
export default router;