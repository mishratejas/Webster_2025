// import cloudinary from "../config/cloudinary.js";

// export const handleImageUpload = async (req, res) => {
//     try {
//         const uploadPromises = req.files.map((file) =>
//             cloudinary.uploader.upload(file.path, { folder: "complaints" })
//         );

//         const results = await Promise.all(uploadPromises);

//         const urls = results.map((r) => r.secure_url);

//         res.json({ success: true, urls });
//     } 
//     catch (err) {
//         console.error("Upload error:", err);
//         res.status(500).json({ success: false, message: "Upload failed" });
//     }
// }

import cloudinary from "../config/cloudinary.js";

export const handleImageUpload = async (req, res) => {
    console.log("Controller called, files:", req.files?.length);
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No files uploaded" 
            });
        }

        // Upload from buffer instead of file path
        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "complaints" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        const results = await Promise.all(uploadPromises);
        const urls = results.map((r) => r.secure_url);

        console.log("Upload successful, URLs:", urls);
        res.json({ success: true, urls });
    } 
    catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Upload failed: " + err.message 
        });
    }
}

