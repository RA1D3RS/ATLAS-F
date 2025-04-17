// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
require('dotenv').config();

/**
 * Middleware d'authentification pour vérifier les JWT tokens
 * Vérifie le token dans l'en-tête Authorization (Bearer)
 * Ajoute req.user avec {id, role} aux requêtes authentifiées
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Vérification de l'existence de l'en-tête Authorization
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'AUTH_NO_TOKEN'
      });
    }

    // Extraction du token
    const token = authHeader.replace('Bearer ', '');

    try {
      // Vérification du token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Recherche de l'utilisateur dans la base de données
      const user = await User.findByPk(decoded.id);

      // Vérification de l'existence de l'utilisateur
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found. Token invalid.', 
          code: 'AUTH_USER_NOT_FOUND' 
        });
      }

      // Vérification si le compte est actif (à ajouter si nécessaire)
      if (user.is_active === false) {
        return res.status(403).json({ 
          error: 'Account is disabled.', 
          code: 'AUTH_ACCOUNT_DISABLED' 
        });
      }

      // Vérification si l'email est vérifié (conformément aux exigences KYC)
      if (!user.is_verified) {
        return res.status(403).json({ 
          error: 'Email not verified.', 
          code: 'AUTH_EMAIL_NOT_VERIFIED' 
        });
      }

      // Ajout des informations utilisateur à la requête
      req.user = { 
        id: user.id, 
        role: user.role 
      };
      
      next();
    } catch (error) {
      // Gestion spécifique des erreurs JWT
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired.', 
          code: 'AUTH_TOKEN_EXPIRED' 
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token.', 
          code: 'AUTH_INVALID_TOKEN' 
        });
      }
      
      // Autres erreurs JWT
      return res.status(401).json({ 
        error: 'Invalid token.', 
        code: 'AUTH_ERROR' 
      });
    }
  } catch (error) {
    // Erreur serveur inattendue
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      code: 'SERVER_ERROR' 
    });
  }
};

module.exports = authMiddleware;