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
      // Si l'utilisateur n'est pas authentifié, on renvoie une erreur 401
      // et on ne lui permet pas d'accéder à la ressource
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Vérifie si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      // Si l'utilisateur n'a pas le rôle requis, on renvoie une erreur 403
      // et on ne lui permet pas d'accéder à la ressource
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Instances prédéfinies pour les cas d'utilisation courants
// Vérifie si l'utilisateur est administrateur
const isAdmin = checkRole(['admin']);
// Vérifie si l'utilisateur est une entreprise
const isCompany = checkRole(['company']);
// Vérifie si l'utilisateur est un investisseur
const isInvestor = checkRole(['investor']);
// Vérifie si l'utilisateur est une entreprise ou un administrateur
const isCompanyOrAdmin = checkRole(['company', 'admin']);
// Vérifie si l'utilisateur est un investisseur ou un administrateur
const isInvestorOrAdmin = checkRole(['investor', 'admin']);

module.exports = {
checkRole,
isAdmin,
isCompany,
isInvestor,
isCompanyOrAdmin,
isInvestorOrAdmin
};