import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/user.routes.js";
import staffRoutes from "./routes/staf.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import user_issue from "./routes/user_issue.routes.js";

const app=express();
const allowedOrigins=[
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];
app.use(cors({
    origin:function(origin,callback){
        if(!origin) return callback(null,true);
        if(allowedOrigins.indexOf(origin)===-1){
            const msg=`The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg),false);
        }
        return callback(null,true);
    },
    credentials:true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//signin/signup (no auth)
app.use("/api/users", userRoutes);
app.use("/api/staff",staffRoutes);
//app.use("/api/admin",adminRoutes);

//(auth req)
app.use("/api/user_issues", user_issue);

app.use(express.static("public"));


//health check
app.get("/health", (req,res)=>{
    res.json(`Server is runnig healthy`)
})


app.listen(3000,()=>{
    console.log("Server running at http://localhost:3000");
});

export {app}