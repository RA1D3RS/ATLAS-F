// backend/src/utils/validators/auth.validator.js

const { body } = require('express-validator');
const { validate } = require('../validators');

/**
 * Règles de validation pour l'inscription utilisateur
 */
const registerValidationRules = [
  // Validation de l'email
  body('email')
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail()
    .trim(),
  
  // Validation du mot de passe
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  
  // Validation du rôle
  body('role')
    .isIn(['admin', 'investor', 'company']).withMessage('Rôle invalide'),
  
  // Validation des informations personnelles obligatoires
  body('first_name')
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit comporter entre 2 et 50 caractères')
    .trim(),
  
  body('last_name')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit comporter entre 2 et 50 caractères')
    .trim(),
  
  body('phone')
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Numéro de téléphone invalide'),
  
  body('birth_date')
    .isDate().withMessage('Format de date de naissance invalide'),
  
  // Validation de l'adresse
  body('address')
    .isLength({ min: 5 }).withMessage('L\'adresse doit comporter au moins 5 caractères')
    .trim(),
  
  body('city')
    .isLength({ min: 2 }).withMessage('La ville doit comporter au moins 2 caractères')
    .trim(),
  
  body('country')
    .isLength({ min: 2 }).withMessage('Le pays doit comporter au moins 2 caractères')
    .trim(),
  
  // Fonction de validation finale
  validate
];

/**
 * Règles de validation pour la connexion utilisateur
 */
const loginValidationRules = [
  body('email')
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis'),
  
  validate
];

module.exports = {
  registerValidationRules,
  loginValidationRules
};