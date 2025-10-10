import UserComplaint from "../models/UserComplaint.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Admin from "../models/Admin.models.js";
export const handleGetStaffComplaints=async(req ,res)=>{
    try{
        const staffId=req.staff._id;
        const {status}=req.query;

        let filter={
            assignedTo: staffId
        };
        if(status && status !== 'all'){
            filter.status=status;
        }
        const complaints=await UserComplaint.find(filter)
        .populate('user', 'name email phone')
            .populate('assignedTo', 'name staffId email')
            .populate('department', 'name')
            .populate('comments.staff', 'name staffId')
            .sort({ 
                priority: -1, // High priority first
                createdAt: -1 // Newest first
            });

        res.status(200).json({
            success: true,
            message: 'Staff complaints fetched successfully',
            data: complaints,
            count: complaints.length
        });

    } catch (error) {
        console.error('Error fetching staff complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff complaints'
        });
    }
};

// Staff updates complaint status
export const handleUpdateStaffComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        const staffId = req.staff._id;
        
        const complaint = await UserComplaint.findById(id);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Check if staff is assigned to this complaint
        if (complaint.assignedTo.toString() !== staffId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this complaint'
            });
        }

        const updates = {};
        const activityLog = [];

        // Update status
        if (status && complaint.status !== status) {
            complaint.status = status;
            updates.status = status;
            activityLog.push(`Status updated to ${status}`);
        }

        // Add staff comments/work notes
        if (comments) {
            complaint.comments.push({
                staff: staffId,
                message: `[STAFF UPDATE]: ${comments}`,
                createdAt: new Date()
            });
            updates.comments = comments;
            activityLog.push('Work notes added');
        }

        complaint.updatedAt = new Date();
        await complaint.save();

        // Populate for response
        await complaint.populate('user', 'name email phone');
        await complaint.populate('assignedTo', 'name staffId email');
        await complaint.populate('department', 'name');
        await complaint.populate('comments.staff', 'name staffId');

        res.json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint,
            updates: updates,
            activity: activityLog
        });

    } catch (error) {
        console.error('Error updating staff complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint'
        });
    }
};

// Get staff workload statistics
export const handleGetStaffStats = async (req, res) => {
    try {
        const staffId = req.staff._id;

        const stats = await UserComplaint.aggregate([
            { $match: { assignedTo: staffId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalAssigned = await UserComplaint.countDocuments({ assignedTo: staffId });
        const pendingCount = await UserComplaint.countDocuments({ 
            assignedTo: staffId, 
            status: 'pending' 
        });
        const inProgressCount = await UserComplaint.countDocuments({ 
            assignedTo: staffId, 
            status: 'in-progress' 
        });
        const resolvedCount = await UserComplaint.countDocuments({ 
            assignedTo: staffId, 
            status: 'resolved' 
        });

        res.status(200).json({
            success: true,
            message: 'Staff statistics fetched successfully',
            data: {
                totalAssigned,
                byStatus: {
                    pending: pendingCount,
                    inProgress: inProgressCount,
                    resolved: resolvedCount
                },
                detailedStats: stats
            }
        });

    } catch (error) {
        console.error('Error fetching staff stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff statistics'
        });
    }
};

// Add this simple function to staff_issue.controller.js
export const getAdminsIdForStaff = asyncHandler(async (req, res) => {
    try {
        console.log("🔍 Fetching admin information...");
        
        // Check if User model is working
        const adminCount = await Admin.countDocuments({ role: 'admin' });
        console.log(`📊 Total admin users: ${adminCount}`);

        const admin = await Admin.findOne({ role: 'admin' })
            .select('_id name email role');

        if (!admin) {
            console.log("❌ No admin user found with role 'admin'");
            return res.status(404).json({
                success: false,
                message: 'No admin user found in system'
            });
        }

        console.log("✅ Admin found:", admin);
        
        res.status(200).json({
            success: true,
            data: {
                adminId: admin._id.toString(),
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ SERVER ERROR in getAdminIdForStaff:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});