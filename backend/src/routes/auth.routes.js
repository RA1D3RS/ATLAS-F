// backend/src/routes/auth.routes.js



const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidationRules, validate } = require('../utils/validators');

/**
 * @route POST /auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', registerValidationRules, validate, authController.register);

/**
 * @route POST /auth/login
 * @desc Connexion d'un utilisateur
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /auth/verify-email
 * @desc Vérification de l'email d'un utilisateur
 * @access Public
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @route POST /auth/forgot-password
 * @desc Demande de réinitialisation du mot de passe
 * @access Public
 */
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;