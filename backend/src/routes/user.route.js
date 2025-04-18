// backend/src/routes/user.route.js

// Dans votre fichier de routes utilisateur
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

// Routes protégées nécessitant un token JWT valide
router.get('/profile', authMiddleware.verifyToken, userController.getMyProfile);
router.put('/profile', authMiddleware.verifyToken, userController.updateMyProfile);

module.exports = router;