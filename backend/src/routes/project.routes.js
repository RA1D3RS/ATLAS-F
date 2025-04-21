// backend/src/routes/project.routes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { isCompany, isAdmin, isCompanyOrAdmin } = require('../middleware/role.middleware');
const projectController = require('../controllers/project.controller');
const { verifyProjectAccess, isProjectOwnerOrAdmin } = require('../middlewares/project.middleware');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');


/**
 * Routes pour la gestion des projets
 */

// Route pour créer un nouveau projet - accessible uniquement aux entreprises
router.post('/', 
  authMiddleware, 
  isCompany,
  projectController.createProject // Appel de la méthode du contrôleur
);

// Route pour obtenir tous les projets - accessible à tous
router.get('/', 
  projectController.getAllProjects // Appel de la méthode du contrôleur
);

// Route pour obtenir un projet spécifique - accessible à tous
router.get('/:id', 
  projectController.getProjectById // Appel de la méthode du contrôleur
);

// Route pour mettre à jour un projet - accessible uniquement aux entreprises propriétaires et aux admins
router.put('/:id', 
  authMiddleware,
  isCompanyOrAdmin,
  projectController.updateProject // Appel de la méthode du contrôleur
);

// Route pour soumettre un projet pour approbation - accessible uniquement aux entreprises
router.post('/:id/submit', 
  authMiddleware,
  isCompany,
  projectController.submitProject // Appel de la méthode du contrôleur
);

// Route pour approuver/rejeter un projet - accessible uniquement aux admins
router.post('/:id/review', 
  authMiddleware,
  isAdmin,
  projectController.reviewProject // Appel de la méthode du contrôleur
);

module.exports = router;