// backend/src/utils/validators.js 
// File: validators.js
// Description: This file contains validation rules for user and project data using express-validator.    
// Validation utility functions for various data types
// and formats are defined here. The validation results are processed and errors are thrown if any validation fails.

/**
 * Validation utilities
 */

const { body, param, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');
const User = require('../models/user.model');

/**
 * Process validation results from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(err => ({
      field: err.param,
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
      .matches(/^\+?[0-9]{10,15}$/).withMessage('Numéro de téléphone invalide'),

    birthDate: body('birth_date')
      .notEmpty().withMessage('Date de naissance requise')
      .isDate().withMessage('Format de date invalide')
      .toDate()
      .custom((value) => {
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
          throw new Error('Vous devez avoir au moins 18 ans');
        }
        return true;
      }),

    address: body('address')
      .optional()
      .isString().withMessage('L\'adresse doit être une chaîne de caractères')
      .trim(),

    city: body('city')
      .optional()
      .isString().withMessage('La ville doit être une chaîne de caractères')
      .trim(),

    country: body('country')
      .optional()
      .isString().withMessage('Le pays doit être une chaîne de caractères')
      .trim()
  },

  profile: {
    investor: {
      investorType: body('investor_type')
        .optional()
        .isIn(['retail', 'professional', 'institutional', 'diaspora'])
        .withMessage('Type d\'investisseur invalide'),

      maxInvestmentAmount: body('max_investment_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le montant maximum d\'investissement doit être un nombre positif')
        .toFloat(),

      termsAccepted: body('terms_accepted')
        .optional()
        .isBoolean()
        .withMessage('La valeur de termes acceptés doit être un booléen')
        .toBoolean()
    },

    company: {
      companyName: body('company_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom de l\'entreprise doit comporter entre 2 et 100 caractères')
        .trim(),

      legalStatus: body('legal_status')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le statut juridique doit comporter entre 2 et 50 caractères')
        .trim(),

      registrationNumber: body('registration_number')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le numéro d\'enregistrement doit comporter entre 2 et 50 caractères')
        .trim(),

      taxId: body('tax_id')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('L\'identifiant fiscal doit comporter entre 2 et 50 caractères')
        .trim(),

      industrySector: body('industry_sector')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le secteur d\'activité doit comporter entre 2 et 50 caractères')
        .trim(),

      website: body('website')
        .optional()
        .isURL()
        .withMessage('Le format de l\'URL du site web est invalide')
        .trim(),

      description: body('description')
        .optional()
        .isLength({ min: 10 })
        .withMessage('La description doit comporter au moins 10 caractères')
        .trim(),

      employeeCount: body('employee_count')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le nombre d\'employés doit être un entier positif')
        .toInt(),

      foundingDate: body('founding_date')
        .optional()
        .isDate()
        .withMessage('Le format de la date de fondation est invalide')
        .toDate()
        .custom((value) => {
          const today = new Date();
          if (new Date(value) > today) {
            throw new Error('La date de fondation ne peut pas être dans le futur');
          }
          return true;
        })
    }
  },

  project: {
    title: body('title')
      .notEmpty().withMessage('Titre requis')
      .isLength({ min: 5, max: 100 }).withMessage('Le titre doit comporter entre 5 et 100 caractères')
      .trim(),

    description: body('description')
      .notEmpty().withMessage('Description requise')
      .isLength({ min: 10 }).withMessage('La description doit comporter au moins 10 caractères')
      .trim(),

    fundingGoal: body('funding_goal')
      .notEmpty().withMessage('Objectif de financement requis')
      .isFloat({ min: 1000 }).withMessage('L\'objectif de financement doit être d\'au moins 1000')
      .toFloat(),

    fundingType: body('funding_type')
      .notEmpty().withMessage('Type de financement requis')
      .isIn(['equity', 'donation']).withMessage('Type de financement invalide')
  },

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
  rules.user.phone,
  rules.user.birthDate,
  rules.user.address,
  rules.user.city,
  rules.user.country
];

const investorProfileValidationRules = [
  rules.profile.investor.investorType,
  rules.profile.investor.maxInvestmentAmount,
  rules.profile.investor.termsAccepted
];

const companyProfileValidationRules = [
  rules.profile.company.companyName,
  rules.profile.company.legalStatus,
  rules.profile.company.registrationNumber,
  rules.profile.company.taxId,
  rules.profile.company.industrySector,
  rules.profile.company.website,
  rules.profile.company.description,
  rules.profile.company.employeeCount,
  rules.profile.company.foundingDate
];

const projectValidationRules = [
  rules.project.title,
  rules.project.description,
  rules.project.fundingGoal,
  rules.project.fundingType
];

module.exports = {
  validate,
  rules,
  registerValidationRules,
  investorProfileValidationRules,
  companyProfileValidationRules,
  projectValidationRules
};