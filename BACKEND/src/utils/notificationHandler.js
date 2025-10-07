import { Server } from "socket.io";
import Notification from "../models/Notification.models.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";
import { sendEmail } from "./email.js";
import { sendSMS } from "./sms.js";

let io;

export const initIo = (server) => {
    io = new Server(server, { 
        cors: { 
            origin: process.env.CLIENT_URL || "*",
            credentials: true
        } 
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        
        socket.on("register", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} registered`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    // Store io globally
    global.io = io;
};

const getRecipientDetails = async (userId) => {
    try {
        let recipient = await User.findById(userId).select('email phone name');
        if (recipient) return recipient;

        recipient = await Staff.findById(userId).select('email phone name');
        if (recipient) return recipient;

        recipient = await Admin.findById(userId).select('email phone name');
        return recipient;
    } catch (error) {
        console.error(`Error fetching recipient for ${userId}:`, error);
        return null;
    }
};

const notificationRoutes = async (userId, type, message, subject) => {
    try {
        const details = await getRecipientDetails(userId);
        
        if (!details) {
            console.error(`Recipient not found: ${userId}`);
            return null;
        }

        // Create notification in database
        const notification = await Notification.create({ 
            userId, 
            type, 
            message 
        });

        // Send real-time notification via Socket.IO
        if (global.io) {
            global.io.to(userId.toString()).emit("notification", {
                ...notification.toObject(),
                timestamp: new Date()
            });
            console.log(`✅ Real-time notification sent to ${details.name}`);
        }

        // Send email asynchronously
        sendEmail(details.email, subject || "Notification", message)
            .catch(err => console.error(`Email failed for ${details.email}:`, err.message));

        // Send SMS if phone exists
        if (details.phone) {
            sendSMS(details.phone, `[System]: ${message}`)
                .catch(err => console.error(`SMS failed for ${details.phone}:`, err.message));
        }
        
        return notification;
    } catch (error) {
        console.error("Error in notificationRoutes:", error);
        return null;
    }
};

export default notificationRoutes;