import express from 'express';
import {
    generateAnalytics,
    getHeatmapData,
    exportAnalytics,
    getStaffPerformance
} from '../controllers/analytics.controllers.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// API routes - REMOVE THE EXTRA '/analytics'
router.get('/', adminAuth, generateAnalytics);                    // Now: /api/admin/analytics
router.get('/heatmap', adminAuth, getHeatmapData);               // Now: /api/admin/analytics/heatmap
router.get('/export', adminAuth, exportAnalytics);               // Now: /api/admin/analytics/export
router.get('/staff-performance', adminAuth, getStaffPerformance); // Now: /api/admin/analytics/staff-performance

export default router;