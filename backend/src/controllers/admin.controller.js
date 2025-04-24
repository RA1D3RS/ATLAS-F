// backend/src/controllers/admin.controller.js
/**
 * Controller handling administrative functions for projects
 * Provides endpoints for admins to list, filter, and view project details
 */

const { Project, User, CompanyProfile, Document, ProjectUpdate, ProjectTeam, ProjectFAQ, InvestmentTransaction, DonationTransaction, Reward } = require('../models');
const logger = require('../utils/logger');

/**
 * List all projects with optional status filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.listProjectsByStatus = async (req, res, next) => {
  try {
    // Extract query parameters
    const { status = 'submitted', page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = req.query;
    
    // Set up pagination
    const offset = (page - 1) * limit;
    
    // Build query options
    const queryOptions = {
      where: {},
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          attributes: ['id', 'company_name', 'industry_sector'],
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'first_name', 'last_name'],
          required: false
        }
      ]
    };
    
    // If status is provided and not 'all', filter by status
    if (status && status !== 'all') {
      queryOptions.where.status = status;
    }
    
    // Execute query
    const { count, rows: projects } = await Project.findAndCountAll(queryOptions);
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error(`Error in listProjectsByStatus: ${error.message}`);
    return next(error);
  }
};

/**
 * Get detailed information about a specific project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProjectDetailsForAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Fetch complete project information with all associations
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name', 'phone']
          }
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'first_name', 'last_name'],
          required: false
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'doc_type', 'file_path', 'original_filename', 'verified', 'verification_notes', 'created_at']
        },
        {
          model: ProjectUpdate,
          as: 'updates',
          attributes: ['id', 'title', 'content', 'created_at']
        },
        {
          model: ProjectTeam,
          as: 'team',
          attributes: ['id', 'name', 'position', 'bio', 'linkedin_url', 'photo_path']
        },
        {
          model: ProjectFAQ,
          as: 'faqs',
          attributes: ['id', 'question', 'answer']
        },
        {
          model: InvestmentTransaction,
          as: 'investments',
          attributes: ['id', 'investor_id', 'amount', 'status', 'created_at'],
          include: {
            model: User,
            as: 'investor',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        },
        {
          model: DonationTransaction,
          as: 'donations',
          attributes: ['id', 'donor_id', 'amount', 'status', 'created_at']
        },
        {
          model: Reward,
          as: 'rewards',
          attributes: ['id', 'title', 'description', 'min_donation', 'quantity_available', 'quantity_claimed']
        }
      ]
    });
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Calculate project statistics
    const totalInvestments = project.investments.reduce((sum, inv) => sum + (inv.status === 'completed' ? parseFloat(inv.amount) : 0), 0);
    const totalDonations = project.donations.reduce((sum, don) => sum + (don.status === 'completed' ? parseFloat(don.amount) : 0), 0);
    const fundingProgress = ((totalInvestments + totalDonations) / parseFloat(project.funding_goal)) * 100;
    
    // Add statistics to response
    project.dataValues.statistics = {
      totalInvestments,
      totalDonations,
      fundingProgress: Math.min(fundingProgress, 100), // Cap at 100%
      investorCount: new Set(project.investments.map(inv => inv.investor_id)).size,
      donorCount: project.donations.filter(don => don.donor_id).length,
      totalBackers: new Set([
        ...project.investments.map(inv => inv.investor_id),
        ...project.donations.filter(don => don.donor_id).map(don => don.donor_id)
      ]).size
    };
    
    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error(`Error in getProjectDetailsForAdmin: ${error.message}`);
    return next(error);
  }
};

/**
 * Update the status of a project (e.g., approve, reject)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, review_notes, risk_rating } = req.body;
    
    // Validate status
    const validStatuses = ['under_review', 'approved', 'rejected', 'active'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Find project
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Update project
    await project.update({
      status,
      review_notes: review_notes || project.review_notes,
      risk_rating: risk_rating || project.risk_rating,
      reviewer_id: req.user.id // Set the current admin as reviewer
    });
    
    return res.status(200).json({
      success: true,
      message: `Project status updated to ${status}`,
      data: {
        id: project.id,
        title: project.title,
        status: project.status,
        reviewer_id: project.reviewer_id,
        updated_at: project.updated_at
      }
    });
  } catch (error) {
    logger.error(`Error in updateProjectStatus: ${error.message}`);
    return next(error);
  }
};