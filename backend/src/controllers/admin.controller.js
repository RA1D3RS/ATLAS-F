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
 * Get complete project details for administrative review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProjectDetailsForAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Validate projectId format (assuming UUID)
    if (!projectId || projectId.length !== 36) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }
    
    // Fetch complete project information with all associations for admin review
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          attributes: [
            'id', 'company_name', 'legal_status', 'registration_number', 
            'tax_id', 'industry_sector', 'website', 'description', 
            'employee_count', 'founding_date', 'address', 'city', 'kyc_status'
          ],
          include: {
            model: User,
            as: 'user',
            attributes: [
              'id', 'email', 'first_name', 'last_name', 'phone', 
              'birth_date', 'address', 'city', 'country', 
              'email_verified', 'phone_verified', 'created_at'
            ]
          }
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'created_at'],
          required: false
        },
        {
          model: Document,
          as: 'documents',
          attributes: [
            'id', 'doc_type', 'file_path', 'original_filename', 
            'mime_type', 'verified', 'verification_notes', 'created_at'
          ]
        },
        {
          model: ProjectUpdate,
          as: 'updates',
          attributes: ['id', 'title', 'content', 'created_at'],
          order: [['created_at', 'DESC']]
        },
        {
          model: ProjectTeam,
          as: 'team',
          attributes: [
            'id', 'name', 'position', 'bio', 'linkedin_url', 
            'photo_path', 'created_at'
          ]
        },
        {
          model: ProjectFAQ,
          as: 'faqs',
          attributes: ['id', 'question', 'answer', 'created_at']
        },
        {
          model: InvestmentTransaction,
          as: 'investments',
          attributes: [
            'id', 'investor_id', 'amount', 'status', 'payment_method', 
            'contract_accepted', 'created_at'
          ],
          include: {
            model: User,
            as: 'investor',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        },
        {
          model: DonationTransaction,
          as: 'donations',
          attributes: [
            'id', 'donor_id', 'amount', 'status', 'payment_method', 
            'reward_id', 'created_at'
          ],
          include: [
            {
              model: User,
              as: 'donor',
              attributes: ['id', 'email', 'first_name', 'last_name'],
              required: false // Allow anonymous donations
            },
            {
              model: Reward,
              as: 'reward',
              attributes: ['id', 'title', 'min_donation'],
              required: false
            }
          ]
        },
        {
          model: Reward,
          as: 'rewards',
          attributes: [
            'id', 'title', 'description', 'min_donation', 
            'quantity_available', 'quantity_claimed', 'estimated_delivery', 
            'shipping_restrictions', 'created_at'
          ]
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
    
    // Calculate comprehensive project statistics for admin review
    const completedInvestments = project.investments.filter(inv => inv.status === 'completed');
    const completedDonations = project.donations.filter(don => don.status === 'completed');
    
    const totalInvestments = completedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const totalDonations = completedDonations.reduce((sum, don) => sum + parseFloat(don.amount || 0), 0);
    const totalRaised = totalInvestments + totalDonations;
    const fundingGoal = parseFloat(project.funding_goal || 0);
    const fundingProgress = fundingGoal > 0 ? (totalRaised / fundingGoal) * 100 : 0;
    
    // Calculate unique backers
    const investorIds = new Set(completedInvestments.map(inv => inv.investor_id).filter(Boolean));
    const donorIds = new Set(completedDonations.map(don => don.donor_id).filter(Boolean));
    const allBackerIds = new Set([...investorIds, ...donorIds]);
    
    // Calculate transaction statistics
    const transactionStats = {
      total: project.investments.length + project.donations.length,
      completed: completedInvestments.length + completedDonations.length,
      pending: project.investments.filter(inv => inv.status === 'initiated' || inv.status === 'processing').length +
               project.donations.filter(don => don.status === 'initiated' || don.status === 'processing').length,
      failed: project.investments.filter(inv => inv.status === 'failed').length +
              project.donations.filter(don => don.status === 'failed').length
    };
    
    // Document verification status
    const documentStats = {
      total: project.documents.length,
      verified: project.documents.filter(doc => doc.verified).length,
      pending: project.documents.filter(doc => !doc.verified).length
    };
    
    // Add comprehensive statistics for admin evaluation
    const adminStatistics = {
      funding: {
        totalRaised,
        totalInvestments,
        totalDonations,
        fundingGoal,
        fundingProgress: Math.min(fundingProgress, 100),
        remainingAmount: Math.max(fundingGoal - totalRaised, 0)
      },
      backers: {
        total: allBackerIds.size,
        investors: investorIds.size,
        donors: donorIds.size
      },
      transactions: transactionStats,
      documents: documentStats,
      engagement: {
        updatesCount: project.updates.length,
        teamMembersCount: project.team.length,
        faqsCount: project.faqs.length,
        rewardsCount: project.rewards.length
      },
      timeline: {
        projectCreated: project.created_at,
        lastUpdated: project.updated_at,
        daysActive: project.start_date ? Math.ceil((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24)) : null,
        daysRemaining: project.end_date ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }
    };
    
    // Add admin-specific evaluation data
    project.dataValues.adminStatistics = adminStatistics;
    
    // Add risk assessment indicators for admin review
    const riskIndicators = {
      companyKycStatus: project.company?.kyc_status || 'unknown',
      documentVerificationRate: documentStats.total > 0 ? (documentStats.verified / documentStats.total) * 100 : 0,
      founderVerification: {
        emailVerified: project.company?.user?.email_verified || false,
        phoneVerified: project.company?.user?.phone_verified || false
      },
      projectCompleteness: {
        hasTeam: project.team.length > 0,
        hasFaqs: project.faqs.length > 0,
        hasUpdates: project.updates.length > 0,
        hasDocuments: project.documents.length > 0
      }
    };
    
    project.dataValues.riskIndicators = riskIndicators;
    
    logger.info(`Admin ${req.user.id} accessed project details for project ${projectId}`);
    
    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project details retrieved successfully'
    });
    
  } catch (error) {
    logger.error(`Error in getProjectDetailsForAdmin: ${error.message}`, {
      projectId: req.params.projectId,
      adminId: req.user?.id,
      stack: error.stack
    });
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
    
    // Validate risk rating if provided
    if (risk_rating && (risk_rating < 1 || risk_rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Risk rating must be between 1 and 5'
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
    
    // Update project with admin review
    await project.update({
      status,
      review_notes: review_notes || project.review_notes,
      risk_rating: risk_rating || project.risk_rating,
      reviewer_id: req.user.id,
      updated_at: new Date()
    });
    
    logger.info(`Admin ${req.user.id} updated project ${projectId} status to ${status}`, {
      projectId,
      newStatus: status,
      reviewerId: req.user.id,
      riskRating: risk_rating
    });
    
    return res.status(200).json({
      success: true,
      message: `Project status updated to ${status}`,
      data: {
        id: project.id,
        title: project.title,
        status: project.status,
        reviewer_id: project.reviewer_id,
        risk_rating: project.risk_rating,
        updated_at: project.updated_at
      }
    });
  } catch (error) {
    logger.error(`Error in updateProjectStatus: ${error.message}`, {
      projectId: req.params.projectId,
      adminId: req.user?.id,
      stack: error.stack
    });
    return next(error);
  }
};