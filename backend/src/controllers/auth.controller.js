// backend/src/controllers/auth.controller.js
//  /**
//  * Login validation rules
//  **/

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');
const appConfig = require('../config/app');
const InvestorProfile = require('../models/investor.model');
const CompanyProfile = require('../models/company.model');
const sequelize = require('../config/database');
const { sequelize } = require('../config/database');

/**
 * Contrôleur pour gérer l'inscription d'un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const register = async (req, res, next) => {
  try {
    // Valider les données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()     
      });
    }

    // Extraire les données d'inscription du corps de la requête
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      role, 
      phone = null,
      address = null,
      city = null,
      country = null
    } = req.body;

    // Vérifier si le rôle est autorisé pour l'inscription
    if (role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Inscription avec le rôle admin non autorisée'
      });
    }

    // Vérifier si le rôle est valide
    if (!['investor', 'company'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Rôle invalide'
      });
    }

    // Utiliser une transaction pour garantir l'atomicité
    const result = await sequelize.transaction(async (t) => {
      // Créer l'utilisateur
      const newUser = await User.create({
        email,
        password,
        first_name,
        last_name,
        role,
        phone,
        address,
        city,
        country,
        email_verified: false,
        phone_verified: false,
        is_active: true
      }, { transaction: t });

      // Créer le profil associé en fonction du rôle
      if (role === 'investor') {
        await InvestorProfile.create({
          user_id: newUser.id
        }, { transaction: t });
      } else if (role === 'company') {
        await CompanyProfile.create({
          user_id: newUser.id
        }, { transaction: t });
      }

      return newUser;
    });

    // TODO: Intégrer l'appel au service d'email pour la vérification
    // exemple: await emailService.sendVerificationEmail(result);
    logger.info(`Placeholder: Envoyer email de vérification à ${result.email}`);

    // Générer un jeton de vérification d'email (utilisé pour le lien de vérification)
    const verificationToken = jwt.sign(
      { userId: result.id, action: 'verify_email' },
      appConfig.jwt.secret,
      { expiresIn: '24h' }
    );

    // Renvoyer une réponse de succès
    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès. Veuillez vérifier votre adresse email.',
      data: {
        userId: result.id,
        email: result.email,
        role: result.role,
        verified: result.email_verified
      }
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    next(error);
  }
};

/**
 * Contrôleur pour gérer la connexion d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validations de base
    if (!email || !password) {
      throw new BadRequestError('Email et mot de passe requis');
    }

    // Rechercher l'utilisateur par email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Identifiants invalides');
    }

    // Vérifier si l'email est vérifié
    if (!user.email_verified) {
      throw new UnauthorizedError('Veuillez vérifier votre adresse email avant de vous connecter');
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      throw new UnauthorizedError('Votre compte a été désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Identifiants invalides');
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    );

    // Renvoyer le token avec les informations de base de l'utilisateur
    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour vérifier l'email d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new BadRequestError('Token de vérification manquant');
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, appConfig.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestError('Le token de vérification a expiré');
      }
      throw new BadRequestError('Token de vérification invalide');
    }

    // Vérifier si le token est bien pour la vérification d'email
    if (decoded.action !== 'verify_email') {
      throw new BadRequestError('Type de token invalide');
    }

    // Chercher l'utilisateur
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new BadRequestError('Utilisateur non trouvé');
    }

    // Vérifier si l'email est déjà vérifié
    if (user.email_verified) {
      return res.json({
        status: 'success',
        message: 'Email déjà vérifié'
      });
    }

    // Mettre à jour le statut de vérification
    await user.update({ email_verified: true });

    res.json({
      status: 'success',
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Contrôleur pour demander la réinitialisation du mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError('Email requis');
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, nous ne révélons pas si l'email existe ou non
      return res.json({
        status: 'success',
        message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { userId: user.id, action: 'reset_password' },
      appConfig.jwt.secret,
      { expiresIn: '1h' }
    );

    // TODO: Intégrer l'appel au service d'email pour envoyer le lien de réinitialisation
    // exemple: await emailService.sendPasswordResetEmail(user.email, resetToken);
    logger.info(`Placeholder: Envoyer email de réinitialisation à ${user.email}`);

    res.json({
      status: 'success',
      message: 'Si votre email existe dans notre système, vous recevrez un lien de réinitialisation'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, verifyEmail, forgotPassword };