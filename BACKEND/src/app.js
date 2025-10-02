import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/user.routes.js";
import staffRoutes from "./routes/staf.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/staff",staffRoutes);
//app.use("/api/admin",adminRoutes);

app.use(express.static("public"));
app.listen(3000,()=>{
    console.log("Server running at http://localhost:3000");
});

export {app}