import express from "express";
import mongoose from "mongoose"; 
import dotenv from "dotenv"

import { MONGODB_URI,PORT } from "./src/constants.js";

dotenv.config();
const app=express();

mongoose.connect(MONGODB_URI,{useNew})