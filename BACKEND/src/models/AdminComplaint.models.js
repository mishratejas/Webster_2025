import mongoose from "mongoose";

const adminComplaintSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["staff-misconduct","resource-issue","policy-violation","others"],
        required:true
    },
    status:{
        type:String,
        enum:["open","under-review","resolved","dismissed"],
        default:"open"
    },
    raisedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:true
    },
    againstStaff:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Staff"
    },
    againstDepartment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department"
    },
    evidence:[{type:String}],
    comments:[{
        admin:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Admin"
        },
        message:String,
        createdAt:{
            type:Date,
            default:Date.now
        }
    }],
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
});

export default mongoose.model("AdminComplaint",adminComplaintSchema);