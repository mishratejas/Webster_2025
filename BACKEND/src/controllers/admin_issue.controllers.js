import UserComplaint from "../models/UserComplaint.models.js";
import Staff from "../models/Staff.models.js"; // Added import

// --- 1. NEW: Fetch ALL Complaints for Admin Dashboard ---
export const handleFetchAllUserIssues = async (req, res) => {
    try {
        // 1. Get status filter from query (e.g., "?status=New (Triage)")
        let { status,priority, category,assignedTo} = req.query;
        let filter = {};

        // 2. Map frontend tabs to backend model status values
        if (status) {
            let dbStatus = '';
            switch (status) {
                case 'New (Triage)': dbStatus = 'pending'; break;
                case 'Assigned': 
                case 'In-Progress': dbStatus = 'in-progress'; break;
                case 'On Hold': dbStatus = 'in-progress'; break; // Assuming 'On Hold' is a sub-state of in-progress
                case 'Resolved (Audit)': dbStatus = 'resolved'; break;
                case 'Rejected':dbStatus='rejected';break;
                default: dbStatus = status.toLowerCase();
            }
            // Filter by the mapped database status
            filter.status = dbStatus;
            if(priority && priority !== 'all') filter.priority=priority;
            if(category && category !== 'all') filter.category = category;
            if(assignedTo && assignedTo!=='all'){
                if(assignedTo === 'unassigned'){
                    filter.assignedTo = {$exists: false};
                }
                else{
                    filter.assignedTo = assignedTo;
                }
            }
        }

        const issues = await UserComplaint.find(filter) // Apply the filter
            .populate('user', 'name email') 
            .populate('assignedTo', 'name staffId') 
            .populate('department', 'name') 
            .populate('comments.staff','name staffId')
            .sort({ 
                priority:-1,
                createdAt:-1 });

        return res.status(200).json({
            success: true,
            message: 'All user complaints fetched successfully.',
            data: issues // Use 'data' instead of 'issues' to match your response structure
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching complaints.'
        });
    }
};

// --- 2. NEW: Fetch Staff List for Assignment Dropdowns ---
export const handleFetchStaffList = async (req, res) => {
    try {
        const staffList = await Staff.find()
        .select('name _id staffId email department')
        .populate('department','name');
        
        if (staffList.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No staff members found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Staff list fetched successfully.',
            data: staffList
        });

    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching staff list.'
        });
    }
};


// --- 3. EXISTING: Update/Alter Issue ---
export const handleUpdateIssue = async(req,res)=>{
    try{
        const {id} =req.params;
        // Make sure to extract 'staffId' for comments if the admin is adding a comment
        const {
            status,
            priority,
            assignedTo,
            comments,
            department,
            category,
            title,
            description,
            rejectionReason
        }=req.body; 
        
        const adminId=req.admin?._id;

        const complaint=await UserComplaint.findById(id);
        
        if(!complaint){
            return res.status(404).json({
                success:false,
                message:'Complaint not found'
            });
        }
        const updates={};
        const activityLog=[];
        // 1. STATUS MANAGEMENT
        if (status && complaint.status !== status) {
            updates.status = status;
            complaint.status = status;
            activityLog.push(`Status changed to ${status}`);
        }

        // 2. PRIORITY MANAGEMENT
        if (priority && complaint.priority !== priority) {
            updates.priority = priority;
            complaint.priority = priority;
            activityLog.push(`Priority set to ${priority}`);
        }

        // 3. STAFF ASSIGNMENT (Most Important Feature)
        if (assignedTo !== undefined) {
            const oldAssignee = complaint.assignedTo;
            complaint.assignedTo = assignedTo || null;
            updates.assignedTo = assignedTo;

            if (assignedTo) {
                activityLog.push(`Assigned to staff member`);
                // Auto-change status when assigned
                if (complaint.status === 'pending') {
                    complaint.status = 'in-progress';
                    updates.status = 'in-progress';
                    activityLog.push('Auto-changed status to in-progress');
                }
            } else {
                activityLog.push('Assignment removed');
            }
        }

        // 4. DEPARTMENT ASSIGNMENT
        if (department !== undefined) {
            complaint.department = department || null;
            updates.department = department;
            if (department) {
                activityLog.push('Department assigned');
            }
        }

        // 5. CATEGORY CORRECTION
        if (category && complaint.category !== category) {
            complaint.category = category;
            updates.category = category;
            activityLog.push(`Category changed to ${category}`);
        }

        // 6. TITLE/DESCRIPTION CORRECTION
        if (title && complaint.title !== title) {
            complaint.title = title;
            updates.title = title;
            activityLog.push('Title updated');
        }
        
        if (description && complaint.description !== description) {
            complaint.description = description;
            updates.description = description;
            activityLog.push('Description updated');
        }

        // 7. REJECTION WITH REASON
        if (status === 'rejected' && rejectionReason) {
            complaint.comments.push({ 
                staff: adminId, 
                message: `[REJECTED]: ${rejectionReason}`,
                createdAt: new Date()
            });
            activityLog.push('Complaint rejected with reason');
        }

        // 8. ADD INTERNAL COMMENTS/ADMIN NOTES
        if (comments) {
            complaint.comments.push({ 
                staff: adminId, 
                message: `[ADMIN NOTE]: ${comments}`,
                createdAt: new Date()
            });
            updates.comments = comments;
            activityLog.push('Admin note added');
        }

        complaint.updatedAt = new Date();
        await complaint.save();

        // Populate all fields for response
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
        console.error('Error updating complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint'
        });
    }
};

// Get single complaint details
export const handleGetComplaintDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const complaint = await UserComplaint.findById(id)
            .populate('user', 'name email phone')
            .populate('assignedTo', 'name staffId email department')
            .populate('department', 'name')
            .populate('comments.staff', 'name staffId');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Complaint details fetched successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Error fetching complaint details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaint details'
        });
    }
};

// Bulk assign complaints to staff
export const handleBulkAssign = async (req, res) => {
    try {
        const { complaintIds, assignedTo } = req.body;
        const adminId = req.admin?._id;

        if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide complaint IDs to assign'
            });
        }

        if (!assignedTo) {
            return res.status(400).json({
                success: false,
                message: 'Please specify staff member to assign'
            });
        }

        // Update all complaints
        const result = await UserComplaint.updateMany(
            { _id: { $in: complaintIds } },
            { 
                $set: { 
                    assignedTo: assignedTo,
                    status: 'in-progress',
                    updatedAt: new Date()
                },
                $push: {
                    comments: {
                        staff: adminId,
                        message: `[BULK ASSIGNED]: Assigned to staff member`,
                        createdAt: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            message: `Successfully assigned ${result.modifiedCount} complaints to staff`,
            data: {
                assignedCount: result.modifiedCount,
                assignedTo: assignedTo
            }
        });

    } catch (error) {
        console.error('Error in bulk assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Error during bulk assignment'
        });
    }
};