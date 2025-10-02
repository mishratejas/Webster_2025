import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
const connectDB=async()=>{
     try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
        });
        console.log(`MongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB Connection error:", error);
        process.exit(1);
    }
}
export default connectDB;