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
 * Project management routes for administrators
 */

/**
 * GET /projects - List projects with pagination and filtering
 * Query parameters:
 * - status: Filter by project status (submitted, under_review, approved, rejected, active, all)
 * - page: Page number for pagination (default: 1)
 * - limit: Number of projects per page (default: 10)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (ASC/DESC, default: DESC)
 */
router.get('/projects', adminController.listProjectsByStatus);

/**
 * GET /projects/:projectId - Get complete project details for admin review
 * Returns comprehensive project information including:
 * - Project basic information and status
 * - Company profile and founder details
 * - All project documents and verification status
 * - Team members and project FAQ
 * - Investment and donation transactions
 * - Rewards and project updates
 * - Administrative statistics and risk indicators
 * - Funding progress and backer information
 */
router.get('/projects/:projectId', adminController.getProjectDetailsForAdmin);

/**
 * PATCH /projects/:projectId/status - Update project status and review
 * Body parameters:
 * - status: New project status (under_review, approved, rejected, active)
 * - review_notes: Admin review comments (optional)
 * - risk_rating: Risk assessment rating 1-5 (optional)
 */
router.patch('/projects/:projectId/status', 
  // Add validation middleware for status updates
  [
    // You can add validation rules here if needed
    // For example: body('status').isIn(['under_review', 'approved', 'rejected', 'active'])
    // body('risk_rating').optional().isInt({ min: 1, max: 5 })
  ],
  adminController.updateProjectStatus
);

/**
 * Additional admin routes can be added here:
 * 
 * User management routes:
 * - GET /users - List all users with filtering
 * - GET /users/:userId - Get user details
 * - PATCH /users/:userId/status - Update user status
 * 
 * KYC verification routes:
 * - GET /kyc/pending - List pending KYC verifications
 * - PATCH /kyc/:userId/verify - Approve/reject KYC
 * 
 * Platform statistics routes:
 * - GET /stats/dashboard - Get dashboard statistics
 * - GET /stats/projects - Get project statistics
 * - GET /stats/users - Get user statistics
 * - GET /stats/transactions - Get transaction statistics
 * 
 * Document management routes:
 * - GET /documents - List all documents
 * - PATCH /documents/:documentId/verify - Verify document
 * 
 * Transaction monitoring routes:
 * - GET /transactions - List all transactions
 * - GET /transactions/:transactionId - Get transaction details
 * 
 * Example implementations:
 * 
 * router.get('/users', adminController.listUsers);
 * router.get('/users/:userId', adminController.getUserDetails);
 * router.patch('/users/:userId/status', adminController.updateUserStatus);
 * router.get('/kyc/pending', adminController.listPendingKyc);
 * router.patch('/kyc/:userId/verify', adminController.verifyKyc);
 * router.get('/stats/dashboard', adminController.getDashboardStats);
 * router.get('/documents', adminController.listDocuments);
 * router.patch('/documents/:documentId/verify', adminController.verifyDocument);
 * router.get('/transactions', adminController.listTransactions);
 */

module.exports = router;