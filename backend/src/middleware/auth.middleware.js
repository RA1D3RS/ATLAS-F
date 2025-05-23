// backend/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const {User, companyProfile} = require('../models');
const { formatError } = require('../utils/errors');
require('dotenv').config();

/**
 * Middleware d'authentification pour vérifier les JWT tokens
 * Vérifie le token dans l'en-tête Authorization (Bearer)
 * Ajoute req.user avec {id, role} aux requêtes authentifiées
 */

/**
 * Middleware pour vérifier le token JWT d'authentification
 */
const verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token is required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }
    const token = authHeader.split(' ')[1];
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Récupérer l'utilisateur à partir du token décodé
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }
    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account is disabled',
        code: 'AUTH_ACCOUNT_DISABLED'
      });
    }
    // Vérifier si l'email est vérifié
    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        code: 'AUTH_EMAIL_NOT_VERIFIED'
      });
    }
    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      role: user.role
    };
    // Passer au middleware suivant
    next();
  } catch (error) {
    // Gérer les erreurs de token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }
    // Autres erreurs
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
  const formattedError = formatError(error);
  if (formattedError) {
    return res.status(formattedError.statusCode || 500).json(formattedError);
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est administrateur
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Insufficient permissions.',
      code: 'AUTH_INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};
/**
 * Middleware pour vérifier si l'utilisateur est propriétaire d'un projet
 * ou administrateur
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

module.exports = {
  authMiddleware,
  verifyToken,
  isAdmin
};