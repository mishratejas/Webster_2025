import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/user.routes.js";
import staffRoutes from "./routes/staf.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import user_issue from "./routes/user_issue.routes.js";
import uploadRouter from "./routes/upload.routes.js"
import adminIssueRoutes from "./routes/admin_issue.routes.js";
import staffIssueRoutes from "./routes/staff_issue.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from "./routes/chat.routes.js";

const app = express();
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:3000',  // Add this
    'http://localhost:3000'
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Add this
    allowedHeaders: ['Content-Type', 'Authorization'] // Add this
}));

app.options(/.*/, cors());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add this before your routes in app.js
app.get("/api/debug/routes", (req, res) => {
    res.json({
        message: "Server is running",
        routes: [
            "/api/admin/issues",
            "/api/staff/issues", 
            "/api/admin/issues/staff",
            "/api/staff/issues/stats"
        ]
    });
});
//signin/signup (no auth)
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/issues", adminIssueRoutes);
app.use('/api/staff/issues',staffIssueRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
//(auth req)
app.use("/api/user_issues", user_issue);

app.use(express.static("public"));


//health check
app.get("/health", (req, res) => {
    res.json(`Server is runnig healthy`)
})

// 🔹 Global error handler (important for multer 413 errors)
app.use((err, req, res, next) => {
    console.error("Error:", err.message);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File too large. Max 10MB allowed.'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server error'
    });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});

export { app }