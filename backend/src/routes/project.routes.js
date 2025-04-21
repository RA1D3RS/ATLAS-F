// backend/src/routes/project.routes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { isCompany, isAdmin, isCompanyOrAdmin } = require('../middleware/role.middleware');
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {isProjectOwnerOrAdmin,verifyProjectAccess} = require('../middleware/project.middleware');


/**
 * Routes pour la gestion des projets
 */

// Route pour créer un nouveau projet - accessible uniquement aux entreprises
router.post('/', 
  verifyToken, 
  authMiddleware, 
  isCompany,
  // Vérifie que l'utilisateur a accès au projet
  verifyProjectAccess(['draft']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin
  projectController.createProject // Appel de la méthode du contrôleur
);

// Route pour obtenir tous les projets - accessible à tous
router.get('/',
  verifyToken, 
  authMiddleware,
  verifyProjectAccess(['draft', 'submitted', 'approved', 'active', 'funded']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin
  projectController.getAllProjects // Appel de la méthode du contrôleur
);

// Route pour obtenir un projet spécifique - accessible à tous
router.get('/:id',
  verifyToken,
  authMiddleware,
  verifyProjectAccess(['draft', 'submitted', 'approved', 'active', 'funded']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin 
  projectController.getProjectById // Appel de la méthode du contrôleur
);

// Route pour mettre à jour un projet - accessible uniquement aux entreprises propriétaires et aux admins
router.put('/:id',
  verifyToken, 
  authMiddleware,
  isCompanyOrAdmin,
  verifyProjectAccess(['draft', 'submitted']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin
  projectController.updateProject // Appel de la méthode du contrôleur
);

// Route pour soumettre un projet pour approbation - accessible uniquement aux entreprises
router.post('/:id/submit',
  verifyToken, 
  authMiddleware,
  isCompany,
  verifyProjectAccess(['draft']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin
  projectController.submitProject // Appel de la méthode du contrôleur
);

// Route pour approuver/rejeter un projet - accessible uniquement aux admins
router.post('/:id/review',
  verifyToken, 
  authMiddleware,
  isAdmin,
  verifyProjectAccess(['submitted']), // Vérifie que l'utilisateur a accès au projet
  isProjectOwnerOrAdmin, // Vérifie que l'utilisateur est le propriétaire du projet ou admin
  projectController.reviewProject // Appel de la méthode du contrôleur
);

module.exports = router;