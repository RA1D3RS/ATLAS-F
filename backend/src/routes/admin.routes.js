// backend/src/routes/admin.routes.js
/**
 * Administrative routes
 * These routes are only accessible to users with admin privileges
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { projectValidationRules, validate } = require('../middleware/validation');

// Apply authentication and admin role check to all routes
router.use(authenticateJWT, isAdmin);

/**
 * Project management routes
 * GET /projects - List projects with pagination and filtering
 * GET /projects/:projectId - Get detailed project information
 * PATCH /projects/:projectId/status - Update project status (approval workflow)
 */
router.get('/projects', adminController.listProjectsByStatus);
router.get('/projects/:projectId', adminController.getProjectDetailsForAdmin);
router.patch('/projects/:projectId/status', adminController.updateProjectStatus);

/**
 * Additional admin routes can be added here:
 * - User management
 * - KYC verification
 * - Platform statistics
 * - etc.
 */

module.exports = router;