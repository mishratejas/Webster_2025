// import express from "express";
// import multer from "multer";
// import {handleImageUpload} from '../controllers/upload.controllers.js'

// const router = express.Router();
// const upload = multer({ 
//     dest: "uploads/",
//     limits: { fileSize: 10 * 1024 * 1024 } // 10 MB per file
// }); // temporary folder

// // /api/upload
// router.post("/", upload.array("image", 5), handleImageUpload);

// export default router;

import express from "express";
import multer from "multer";
import { handleImageUpload } from "../controllers/upload.controllers.js";

const router = express.Router();

// Use memory storage instead of disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
}).array("image", 5);

router.post("/", (req, res, next) => {
    console.log("Upload route hit");
    
    upload(req, res, function (err) {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ success: false, message: err.message });
        }
        
        console.log("Multer success, files:", req.files?.length);
        next();
    });
}, handleImageUpload);

export default router;
