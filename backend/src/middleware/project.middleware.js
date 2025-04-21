// backend/src/middlewares/project.middleware.js

const { checkProjectAccess } = require('../utils/project_permissions');
const { formatError } = require('../utils/errors');

/**
 * Middleware pour vérifier l'accès au projet avant d'exécuter un contrôleur
 * 
 * @param {Array<string>} allowedStatuses - Liste des statuts de projet autorisés
 * @param {boolean} adminBypass - Si true, les admins peuvent ignorer les restrictions de statut
 * @returns {Function} Middleware Express
 */
exports.verifyProjectAccess = (allowedStatuses, adminBypass = true) => {
  return async (req, res, next) => {
    try {
      // Si l'utilisateur est admin et que adminBypass est activé, on saute la vérification
      if (adminBypass && req.user && req.user.role === 'admin') {
        // Pour les admins, on vérifie juste que le projet existe
        const project = await checkProjectAccess(
          req.params.id,
          req.user.id,
          null // Pas de vérification de statut pour les admins
        );
        
        // On attache le projet à l'objet request pour une utilisation ultérieure
        req.project = project;
        return next();
      }
      
      // Pour les non-admins, on vérifie l'accès complet
      const project = await checkProjectAccess(
        req.params.id,
        req.user.id,
        allowedStatuses
      );
      
      // On attache le projet à l'objet request pour une utilisation ultérieure
      req.project = project;
      next();
    } catch (error) {
      console.error('Project access verification failed:', error);
      const formattedError = formatError(error);
      res.status(formattedError.statusCode || 500).json(formattedError);
    }
  };
};

/**
 * Middleware qui vérifie si un utilisateur est propriétaire d'un projet ou admin
 * sans tenir compte du statut du projet
 */
exports.isProjectOwnerOrAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    // Vérifier si le projet existe
    const project = await checkProjectAccess(
      projectId,
      req.user.id, 
      null // Ignorer la vérification du statut
    );
    
    // Autoriser l'accès si l'utilisateur est admin
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }
    
    // Le middleware checkProjectAccess a déjà vérifié si l'utilisateur est propriétaire
    req.project = project;
    next();
  } catch (error) {
    console.error('Project ownership verification failed:', error);
    const formattedError = formatError(error);
    res.status(formattedError.statusCode || 500).json(formattedError);
  }
};