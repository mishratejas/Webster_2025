import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.static("public"))
app.use(cookieParser())

app.listen(3000,()=>{
    console.log("Server running at http://localhost:3000");
});

export {app}