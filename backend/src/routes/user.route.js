// backend/src/routes/user.route.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateJWT } = require('../middleware/auth');
const { updateProfileValidationRules } = require('../validators/user.validator');

// Routes protégées nécessitant un token JWT valide
router.get('/profile', authenticateJWT, userController.getMyProfile);
router.put('/profile', authenticateJWT, updateProfileValidationRules, userController.updateMyProfile);

module.exports = router;