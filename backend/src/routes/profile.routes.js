// backend/src/routes/profile.routes.js

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');
const { profileValidationRules, validate } = require('../utils/validators');

/**
 * @route GET /api/profile
 * @desc Récupère le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/', authMiddleware, profileController.getMyProfile);

/**
 * @route PATCH /api/profile/investor
 * @desc Met à jour le profil investisseur
 * @access Private (Investor only)
 */
router.patch(
  '/investor', 
  authMiddleware, 
  checkRole(['investor']), 
  // Ajoutez ici vos règles de validation si nécessaire
  profileController.updateInvestorProfile
);

/**
 * @route PATCH /api/profile/company
 * @desc Met à jour le profil entreprise
 * @access Private (Company only)
 */
router.patch(
  '/company', 
  authMiddleware, 
  checkRole(['company']), 
  // Ajoutez ici vos règles de validation si nécessaire
  profileController.updateCompanyProfile
);

module.exports = router;