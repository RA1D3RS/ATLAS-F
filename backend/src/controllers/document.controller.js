// backend/src/controllers/document.controller.js

const { Document } = require('../models');
const fileService = require('../services/file.service');
const { formatError } = require('../utils/errors');
const { checkProjectAccess } = require('../utils/project_permissions');

/**
 * Contrôleur pour la gestion des documents
 */
const documentController = {
  /**
   * Uploader un document lié à un projet
   * @route POST /api/projects/:projectId/documents
   */
  uploadProjectDocument: async (req, res) => {
    try {
      // Vérifier l'accès au projet
      const project = await checkProjectAccess(
        req.params.projectId,
        req.user.id,
        ['draft', 'submitted'] // Autoriser l'upload pour projets en brouillon ou soumis
      );
      
      // Le fichier est disponible dans req.file grâce à Multer
      const { docType } = req.body;
      
      if (!docType) {
        return res.status(400).json({
          error: 'Le type de document est requis',
          code: 'MISSING_DOC_TYPE'
        });
      }
      
      // Utiliser le service de fichiers pour sauvegarder le document
      const document = await fileService.saveUploadedFile(
        req.file,
        docType,
        req.user.id,
        project.id
      );
      
      res.status(201).json({
        message: 'Document uploadé avec succès',
        document
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },
  
  /**
   * Récupérer tous les documents d'un projet
   * @route GET /api/projects/:projectId/documents
   */
  getProjectDocuments: async (req, res) => {
    try {
      // Vérifier l'accès au projet
      const project = await checkProjectAccess(
        req.params.projectId,
        req.user.id
      );
      
      // Récupérer les documents du projet
      const documents = await Document.findAll({
        where: { project_id: project.id },
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json(documents);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },
  
  /**
   * Télécharger un document spécifique
   * @route GET /api/documents/:id/download
   */
  downloadDocument: async (req, res) => {
    try {
      const document = await Document.findByPk(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          error: 'Document non trouvé',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }
      
      // Vérifier l'accès au document
      // Si le document est lié à un projet, vérifier l'accès au projet
      if (document.project_id) {
        try {
          await checkProjectAccess(
            document.project_id,
            req.user.id
          );
        } catch (error) {
          // Si l'utilisateur n'est pas propriétaire, vérifier s'il est admin
          if (req.user.role !== 'admin') {
            return res.status(403).json({
              error: 'Accès refusé. Permissions insuffisantes.',
              code: 'AUTH_INSUFFICIENT_PERMISSIONS'
            });
          }
        }
      } 
      // Si le document n'est pas lié à un projet, vérifier qu'il appartient à l'utilisateur
      else if (document.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Accès refusé. Permissions insuffisantes.',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Récupérer le fichier
      const fileInfo = await fileService.getFileById(document.id);
      
      // Envoyer le fichier comme réponse HTTP
      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalFilename}"`);
      
      // Envoyer le fichier
      res.sendFile(fileInfo.filePath);
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },
  
  /**
   * Supprimer un document
   * @route DELETE /api/documents/:id
   */
  deleteDocument: async (req, res) => {
    try {
      const document = await Document.findByPk(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          error: 'Document non trouvé',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }
      
      // Vérifier l'accès au document
      // Si le document est lié à un projet, vérifier l'accès au projet
      if (document.project_id) {
        try {
          await checkProjectAccess(
            document.project_id,
            req.user.id,
            ['draft', 'submitted'] // Autoriser la suppression uniquement pour projets en brouillon ou soumis
          );
        } catch (error) {
          // Si l'utilisateur n'est pas propriétaire, vérifier s'il est admin
          if (req.user.role !== 'admin') {
            return res.status(403).json({
              error: 'Accès refusé. Permissions insuffisantes.',
              code: 'AUTH_INSUFFICIENT_PERMISSIONS'
            });
          }
        }
      } 
      // Si le document n'est pas lié à un projet, vérifier qu'il appartient à l'utilisateur
      else if (document.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Accès refusé. Permissions insuffisantes.',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Supprimer le document
      await fileService.deleteFile(document.id);
      
      res.status(200).json({
        message: 'Document supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  },
  
  /**
   * Vérifier un document (admin uniquement)
   * @route PUT /api/documents/:id/verify
   */
  verifyDocument: async (req, res) => {
    try {
      // Vérifier que l'utilisateur est un admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Accès refusé. Réservé aux administrateurs.',
          code: 'AUTH_ADMIN_REQUIRED'
        });
      }
      
      const document = await Document.findByPk(req.params.id);
      
      if (!document) {
        return res.status(404).json({
          error: 'Document non trouvé',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }
      
      // Mettre à jour le statut de vérification
      await document.update({
        verified: req.body.verified === true,
        verification_notes: req.body.notes || null
      });
      
      res.status(200).json({
        message: 'Statut de vérification mis à jour',
        document
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du document:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  }
};

module.exports = documentController;