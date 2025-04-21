// backend/src/routes/document.routes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { createUploadMiddleware } = require('../middleware/upload');
const { authenticateJWT } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateJWT);

// Routes pour les documents liés aux projets
router.post(
  '/projects/:projectId/documents',
  createUploadMiddleware('document', 'project_document'),
  documentController.uploadProjectDocument
);

router.get(
  '/projects/:projectId/documents',
  documentController.getProjectDocuments
);

// Routes pour les documents généraux
router.get(
  '/documents/:id/download',
  documentController.downloadDocument
);

router.delete(
  '/documents/:id',
  documentController.deleteDocument
);

router.put(
  '/documents/:id/verify',
  documentController.verifyDocument
);

// Exemple d'utilisation avec différents types de documents
router.post(
  '/kyc/id-document',
  createUploadMiddleware('document', 'id_card'),
  // Contrôleur spécifique pour les documents d'identité (à implémenter)
  (req, res) => {
    res.status(501).json({ message: 'Non implémenté' });
  }
);

router.post(
  '/projects/:projectId/images',
  createUploadMiddleware('image', 'project_image'),
  // Contrôleur spécifique pour les images de projet (à implémenter)
  (req, res) => {
    res.status(501).json({ message: 'Non implémenté' });
  }
);

module.exports = router;