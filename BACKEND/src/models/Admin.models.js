import mongoose from "mongoose"

const adminSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    phone:{
        type:String,
        match:/^[0-9]{10}$/
    },
    password:{
        type:String,
        required:true
    },
    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department"
    },
    role:{
        type:String,
        enum:["admin","superadmin"],
        default:"admin"
    },
    profileImage:{
        type:String
    },
    permissions:{
        canAssign:{
            type:Boolean,
            default:false
        },
        canResolve:{
            type:Boolean,
            default:true
        },
        canDelete:{
            type:Boolean,
            default:false
        }
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

export default mongoose.model("Admin",adminSchema);