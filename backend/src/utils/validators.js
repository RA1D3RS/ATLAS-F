// backend/src/utils/validators.js 
// File: validators.js
// Description: This file contains validation rules for user and project data using express-validator.    
// Validation utility functions for various data types
// and formats are defined here. The validation results are processed and errors are thrown if any validation fails.

/**
 * Validation utilities
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');
const User = require('../models/user.model');

/**
 * Process validation results from express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    throw new ValidationError('Validation Error', validationErrors);
  }
  next();
};

/**
 * Common validation rules
 */
const rules = {
  // User validation
  user: {
    email: body('email')
      .isEmail().withMessage('Format email invalide')
      .notEmpty().withMessage('Email requis')
      .normalizeEmail()
      .custom(async (value) => {
        const existingUser = await User.findOne({ where: { email: value } });
        if (existingUser) {
          throw new Error('Email déjà utilisé');
        }
        return true;
      })
      .trim(),
    
    password: body('password')
      .notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
      .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
      .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
    
    role: body('role')
      .notEmpty().withMessage('Rôle requis')
      .isIn(['admin', 'investor', 'company']).withMessage('Le rôle doit être "admin", "investor" ou "company"'),
    
    firstName: body('first_name')
      .notEmpty().withMessage('Prénom requis')
      .isString().withMessage('Le prénom doit être une chaîne de caractères')
      .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit comporter entre 2 et 50 caractères')
      .trim(),
    
    lastName: body('last_name')
      .notEmpty().withMessage('Nom requis')
      .isString().withMessage('Le nom doit être une chaîne de caractères')
      .isLength({ min: 2, max: 50 }).withMessage('Le nom doit comporter entre 2 et 50 caractères')
      .trim(),
    
    phone: body('phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/).withMessage('Numéro de téléphone invalide')
  },
  
  // Project validation
  project: {
    title: body('title')
      .isLength({ min: 5, max: 100 }).withMessage('Le titre doit comporter entre 5 et 100 caractères')
      .trim(),
    
    description: body('description')
      .isLength({ min: 10 }).withMessage('La description doit comporter au moins 10 caractères')
      .trim(),
    
    fundingGoal: body('funding_goal')
      .isFloat({ min: 1000 }).withMessage('L\'objectif de financement doit être d\'au moins 1000')
      .toFloat(),
    
    fundingType: body('funding_type')
      .isIn(['equity', 'donation']).withMessage('Type de financement invalide'),
    
    minInvestment: body('min_investment')
      .optional()
      .isFloat({ min: 100 }).withMessage('L\'investissement minimum doit être d\'au moins 100')
      .toFloat()
  },
  
  // Common ID validation
  id: param('id')
    .isUUID(4).withMessage('ID invalide')
};

/**
 * Registration validation rules
 */
const registerValidationRules = [
  rules.user.email,
  rules.user.password,
  rules.user.firstName,
  rules.user.lastName,
  rules.user.role,
  rules.user.phone
];

module.exports = {
  validate,
  rules,
  registerValidationRules
};