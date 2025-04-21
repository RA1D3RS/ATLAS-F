// backend/src/controllers/project.controller.js

const { Project, CompanyProfile, Document } = require('../models');
const { formatError } = require('../utils/errors');
const { checkProjectAccess } = require('../utils/project_permissions');

/**
 * Contrôleur pour la gestion des projets
 */
const projectController = {
  /**
   * Créer un nouveau projet
   * @route POST /api/projects
   */
  createProject: async (req, res) => {
    try {
      // Vérifier que l'utilisateur a un profil d'entreprise
      const companyProfile = await CompanyProfile.findOne({
        where: { user_id: req.user.id }
      });

      if (!companyProfile) {
        return res.status(404).json({
          error: 'Company profile not found',
          code: 'COMPANY_PROFILE_NOT_FOUND'
        });
      }

      // Créer le projet avec les données du corps de la requête
      const projectData = {
        ...req.body,
        company_id: companyProfile.id,
        status: 'draft' // Le statut initial est toujours "draft"
      };

      const newProject = await Project.create(projectData);

      res.status(201).json({
        message: 'Project created successfully',
        project: newProject
      });
    } catch (error) {
      console.error('Error creating project:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },

  /**
   * Récupérer tous les projets
   * @route GET /api/projects
   */
  getAllProjects: async (req, res) => {
    try {
      // Options de filtrage selon les paramètres de requête
      const where = {};
      
      // Ne montrer que les projets approuvés et actifs aux utilisateurs non admin
      if (!req.user || req.user.role !== 'admin') {
        where.status = ['approved', 'active', 'funded'];
      }
      
      // Filtres additionnels si spécifiés
      if (req.query.industry) where.industry_sector = req.query.industry;
      if (req.query.impact) where.impact_type = req.query.impact;
      
      const projects = await Project.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },

  /**
   * Récupérer un projet par son ID
   * @route GET /api/projects/:id
   */
  getProjectById: async (req, res) => {
    try {
      const project = await Project.findByPk(req.params.id);
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Si le projet n'est pas approuvé/actif et que l'utilisateur n'est pas admin
      // ou le propriétaire du projet, refuser l'accès
      if (
        ['draft', 'submitted', 'under_review', 'rejected'].includes(project.status) &&
        (!req.user || (req.user.role !== 'admin' && project.company_id !== req.companyProfile?.id))
      ) {
        return res.status(403).json({
          error: 'Access denied. Insufficient permissions.',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }

      res.status(200).json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },

  /**
   * Mettre à jour un projet
   * @route PUT /api/projects/:id
   */
  updateProject: async (req, res) => {
    try {
      // Utiliser la fonction checkProjectAccess pour vérifier l'accès au projet
      // Seuls les projets en statut 'draft' peuvent être modifiés par leur propriétaire
      const project = await checkProjectAccess(
        req.params.id,
        req.user.id,
        ['draft']
      );

      // Si l'utilisateur est admin, il peut ignorer les restrictions de statut
      if (req.user.role === 'admin') {
        await project.update(req.body);
        return res.status(200).json({
          message: 'Project updated successfully by admin',
          project
        });
      }

      // Mettre à jour les données du projet
      await project.update(req.body);

      res.status(200).json({
        message: 'Project updated successfully',
        project
      });
    } catch (error) {
      console.error('Error updating project:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },

  /**
   * Soumettre un projet pour approbation
   * @route PUT /api/projects/:id/submit
   * @description Vérifie que tous les champs critiques sont remplis et change le statut à 'submitted'
   */
  submitProject: async (req, res) => {
    try {
      // Utiliser la fonction checkProjectAccess pour vérifier l'accès au projet
      // Seuls les projets en statut 'draft' peuvent être soumis pour révision
      const project = await checkProjectAccess(
        req.params.id,
        req.user.id,
        ['draft']
      );

      // Liste des champs critiques obligatoires pour soumettre un projet
      const requiredFields = [
        'title', 
        'description', 
        'funding_goal', 
        'industry_sector', 
        'impact_type',
        'duration_months',
        'expected_return_rate'
      ];

      // Vérification des champs critiques manquants
      const missingFields = requiredFields.filter(field => {
        return !project[field] || project[field].toString().trim() === '';
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields for project submission',
          code: 'MISSING_REQUIRED_FIELDS',
          missingFields
        });
      }

      // Vérifier si les documents requis sont bien attachés au projet
      const requiredDocuments = ['business_plan', 'financial_statements'];
      const projectDocuments = await Document.findAll({
        where: { 
          project_id: project.id,
          doc_type: requiredDocuments
        }
      });

      // Vérifier quels types de documents requis manquent
      const documentTypes = projectDocuments.map(doc => doc.doc_type);
      const missingDocuments = requiredDocuments.filter(docType => !documentTypes.includes(docType));

      if (missingDocuments.length > 0) {
        return res.status(400).json({
          error: 'Missing required documents for project submission',
          code: 'MISSING_REQUIRED_DOCUMENTS',
          missingDocuments
        });
      }

      // Mettre à jour le statut du projet
      await project.update({ 
        status: 'submitted',
        submitted_at: new Date()
      });

      res.status(200).json({
        message: 'Project submitted for review successfully',
        project
      });
    } catch (error) {
      console.error('Error submitting project:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },

  /**
   * Approuver ou rejeter un projet (admin uniquement)
   * @route POST /api/projects/:id/review
   */
  reviewProject: async (req, res) => {
    try {
      const { status, review_notes, risk_rating } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status value. Must be "approved" or "rejected".',
          code: 'INVALID_STATUS'
        });
      }

      const project = await Project.findByPk(req.params.id);
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Vérifier que le projet est en attente de révision
      if (project.status !== 'submitted' && project.status !== 'under_review') {
        return res.status(400).json({
          error: 'Project is not in a reviewable state.',
          code: 'PROJECT_NOT_REVIEWABLE'
        });
      }

      // Mettre à jour le projet avec la décision de l'administrateur
      await project.update({
        status,
        reviewer_id: req.user.id,
        review_notes,
        risk_rating
      });

      res.status(200).json({
        message: `Project ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        project
      });
    } catch (error) {
      console.error('Error reviewing project:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  }
};

module.exports = projectController;