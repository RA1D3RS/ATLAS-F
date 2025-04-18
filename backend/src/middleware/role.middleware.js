// backend/src/middleware/role.middleware.js

/**
 * Middleware pour vérifier les rôles utilisateur
 * @param {string[]} allowedRoles - Tableau des rôles autorisés
 * @returns {function} Middleware Express
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
      // Vérifie si l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
  
      // Vérifie si le rôle de l'utilisateur est dans la liste des rôles autorisés
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied. Insufficient permissions.',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }
  
      next();
    };
  };
  
  module.exports = checkRole;