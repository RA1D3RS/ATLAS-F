// backend/src/middleware/upload.js

/**
 * Middleware d'upload de fichiers basé sur Multer
 * 
 * Configure les règles de validation et de stockage pour les fichiers uploadés :
 * - Limite de taille des fichiers
 * - Types de fichiers autorisés par catégorie
 * - Stockage temporaire
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { formatError } = require('../utils/errors');

// Configuration des limites générales
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB par défaut

// Définition des types MIME autorisés par catégorie de document
const ALLOWED_MIME_TYPES = {
  // Documents d'identité et légaux
  id_card: ['image/jpeg', 'image/png', 'application/pdf'],
  passport: ['image/jpeg', 'image/png', 'application/pdf'],
  company_registration: ['application/pdf'],
  
  // Documents de projet
  business_plan: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  financial_statements: [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  
  // Images et médias de projet
  project_image: ['image/jpeg', 'image/png', 'image/webp'],
  project_video: ['video/mp4', 'video/webm'],
  
  // Par défaut (utilisé si le type spécifique n'est pas défini)
  default: ['application/pdf', 'image/jpeg', 'image/png']
};

// Limites de taille spécifiques par type de document (en octets)
const SIZE_LIMITS = {
  project_image: 5 * 1024 * 1024, // 5 MB pour les images
  project_video: 50 * 1024 * 1024, // 50 MB pour les vidéos
  // Par défaut, utiliser FILE_SIZE_LIMIT pour les autres types
};

// Répertoire temporaire pour les uploads
const TEMP_DIR = path.join(__dirname, '../../temp');

// Créer le répertoire temporaire s'il n'existe pas
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuration du stockage temporaire avec Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier basé sur le timestamp pour éviter les collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'temp-' + uniqueSuffix + fileExtension);
  }
});

// Filtrer les fichiers selon leur type
const fileFilter = (req, file, cb) => {
  // Récupérer le type de document depuis les paramètres ou le corps de la requête
  const docType = req.body.docType || req.query.docType || 'default';
  
  // Trouver les types MIME autorisés pour ce type de document
  const allowedMimeTypes = ALLOWED_MIME_TYPES[docType] || ALLOWED_MIME_TYPES.default;
  
  // Vérifier si le type MIME du fichier est autorisé
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accepter le fichier
    cb(null, true);
  } else {
    // Rejeter le fichier avec un message d'erreur
    cb(new Error(`Type de fichier non autorisé. Types acceptés pour ${docType}: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Créer le middleware d'upload
const createUploadMiddleware = (fieldName, docType = 'default') => {
  // Déterminer la limite de taille pour ce type de document
  const sizeLimit = SIZE_LIMITS[docType] || FILE_SIZE_LIMIT;
  
  // Configuration de base de Multer
  const uploadConfig = {
    storage,
    fileFilter,
    limits: {
      fileSize: sizeLimit
    }
  };
  
  // Créer l'instance de middleware
  const upload = multer(uploadConfig);
  
  // Retourner le middleware avec gestion d'erreur
  return (req, res, next) => {
    // Ajouter le type de document au corps de la requête pour que fileFilter puisse l'utiliser
    req.body.docType = docType;
    
    // Appliquer le middleware d'upload
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        // Gérer les erreurs de Multer
        if (err instanceof multer.MulterError) {
          // Erreur liée à Multer (taille de fichier dépassée, etc.)
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              error: `Taille de fichier dépassée. Maximum: ${sizeLimit / (1024 * 1024)}MB`,
              code: 'FILE_TOO_LARGE'
            });
          }
          return res.status(400).json({
            error: err.message,
            code: err.code
          });
        }
        
        // Autres erreurs (type de fichier non autorisé, etc.)
        return res.status(400).json({
          error: err.message,
          code: 'INVALID_FILE'
        });
      }
      
      // Si aucun fichier n'a été fourni
      if (!req.file) {
        return res.status(400).json({
          error: 'Aucun fichier n\'a été uploadé',
          code: 'NO_FILE_UPLOADED'
        });
      }
      
      // Passer à la prochaine étape si tout est bon
      next();
    });
  };
};

// Middleware pour l'upload de plusieurs fichiers
const createMultipleUploadMiddleware = (fieldName, docType = 'default', maxCount = 5) => {
  // Déterminer la limite de taille pour ce type de document
  const sizeLimit = SIZE_LIMITS[docType] || FILE_SIZE_LIMIT;
  
  // Configuration de base de Multer
  const uploadConfig = {
    storage,
    fileFilter,
    limits: {
      fileSize: sizeLimit
    }
  };
  
  // Créer l'instance de middleware
  const upload = multer(uploadConfig);
  
  // Retourner le middleware avec gestion d'erreur
  return (req, res, next) => {
    // Ajouter le type de document au corps de la requête pour que fileFilter puisse l'utiliser
    req.body.docType = docType;
    
    // Appliquer le middleware d'upload
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        // Même gestion d'erreur que pour l'upload simple
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              error: `Taille de fichier dépassée. Maximum: ${sizeLimit / (1024 * 1024)}MB`,
              code: 'FILE_TOO_LARGE'
            });
          }
          return res.status(400).json({
            error: err.message,
            code: err.code
          });
        }
        
        return res.status(400).json({
          error: err.message,
          code: 'INVALID_FILE'
        });
      }
      
      // Si aucun fichier n'a été fourni
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'Aucun fichier n\'a été uploadé',
          code: 'NO_FILE_UPLOADED'
        });
      }
      
      // Passer à la prochaine étape si tout est bon
      next();
    });
  };
};

module.exports = {
  createUploadMiddleware,
  createMultipleUploadMiddleware,
  // Exporter les constantes pour permettre leur utilisation ailleurs
  ALLOWED_MIME_TYPES,
  SIZE_LIMITS,
  FILE_SIZE_LIMIT,
  TEMP_DIR
};