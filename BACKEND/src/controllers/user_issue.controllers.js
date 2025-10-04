import UserComplaint from "../models/UserComplaint.models.js";

// GET all issues - PUBLIC
export const handleAllIssueFetch = async (req, res) => {
    try {
        const { status } = req.query;
        
        const statusMap = {
            'Open': 'pending',
            'In-Progress': 'in-progress', 
            'Closed': ['resolved', 'rejected']
        };
        
        let filter = {};
        
        if (status && status !== 'All') {
            if (status === 'Closed') {
                filter.status = { $in: statusMap[status] };
            } else {
                filter.status = statusMap[status];
            }
        }
        
        const complaints = await UserComplaint.find(filter)
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        res.json({
            success: true,
            data: complaints,
            count: complaints.length
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching complaints'
        });
    }
};

// POST create issue - PROTECTED (uses your JWT auth)
export const handleIssueGeneration = async (req, res) => {
    try {
        const { title, description, location, category, images } = req.body;
        const userId = req.user._id; // From your auth middleware

        // Validation
        if (!title || !description || !location) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and location are required"
            });
        }

        const complaint = new UserComplaint({
            title,
            description,
            location: {
                address: location
            },
            images,
            category: mapCategoryToBackend(category),
            user: userId, // Link to logged-in user from your JWT
            status: 'pending',
            priority: calculatePriority(category)
        });
        
        await complaint.save();
        await complaint.populate('user', 'name email');
        
        res.status(201).json({ 
            success: true,
            message: 'Complaint submitted successfully', 
            data: complaint
        });
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error submitting complaint'
        });
    }
};

// GET single issue - PUBLIC
export const handleSingleIssueFetch = async (req, res) => {
    try {
        const complaint = await UserComplaint.findById(req.params.id)
            .populate('user', 'name email');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            data: complaint
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching complaint'
        });
    }
};

// PUT vote on issue - PUBLIC
export const handleVoteCount = async (req, res) => {
    try {
        const complaint = await UserComplaint.findById(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ 
                success: false,
                message: 'Complaint not found' 
            });
        }

        complaint.voteCount = (complaint.voteCount || 0) + 1;
        await complaint.save();

        res.json({ 
            success: true,
            message: 'Vote added successfully', 
            data: { voteCount: complaint.voteCount }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error voting on complaint'
        });
    }
};

// Helper functions
function mapCategoryToBackend(frontendCategory) {
    const categoryMap = {
        'infrastructure': 'road',
        'safety': 'other',
        'environment': 'sanitation',
        'other': 'other'
    };
    return categoryMap[frontendCategory] || 'other';
}

function calculatePriority(category) {
    const priorityMap = {
        'road': 'high',
        'water': 'high', 
        'electricity': 'high',
        'sanitation': 'medium',
        'other': 'low'
    };
    return priorityMap[category] || 'medium';
}