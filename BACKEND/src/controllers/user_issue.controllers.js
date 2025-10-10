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

export const handleSingleUserIssueFetch = async (req, res)=>{
    try {
        // Find all issues where the 'user' field matches the logged-in user's ID
        const userIssues = await UserComplaint.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: userIssues.length,
            data: userIssues
        });
    } 
    catch (error) {
        console.error('Error fetching user issues:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

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
                address: location.address,
                latitude: location.latitude,
                longitude: location.longitude,
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

export const handleComplaintLocations = async (req, res) => {
    try {
        const complaints = await UserComplaint.find(
            {
                "location.latitude": { $exists: true, $ne: null },
                "location.longitude": { $exists: true, $ne: null }
            },
            {
                title: 1,
                category: 1,
                priority: 1,
                status: 1,
                "location.latitude": 1,
                "location.longitude": 1,
                "location.address": 1,
                createdAt: 1
            }
        );

        const formatted = complaints.map(c => ({
            title: c.title,
            category: c.category,
            priority: c.priority,
            status: c.status,
            latitude: c.location?.latitude,
            longitude: c.location?.longitude,
            address: c.location?.address || "N/A",
            date: c.createdAt
        }));

        res.json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching complaint locations:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching complaint locations"
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