import express from 'express';


import { 
    handleAllIssueFetch, 
    handleIssueGeneration, 
    handleSingleIssueFetch, 
    handleVoteCount 
} from "../controllers/user_issue.controllers.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/user_issues - Get ALL complaints (public) with status filter
router.get('/', handleAllIssueFetch);

// POST /api/user_issues - Create new complaint (still requires auth)
router.post('/',auth, handleIssueGeneration);

// GET /api/user_issues/:id - Get single complaint details (public)
router.get('/:id', handleSingleIssueFetch);

// PUT /api/user_issues/:id/vote - Add voting system for public engagement
router.put('/:id/vote', handleVoteCount);



export default router;