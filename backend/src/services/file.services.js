// backend/src/services/file.service.js

/**
 * Service de gestion des fichiers
 * 
 * IMPORTANT: Ce service est un placeholder pour une implémentation locale.
 * Dans un environnement de production, il devra être remplacé par une solution
 * de stockage cloud (AWS S3, Google Cloud Storage, etc.) avec une meilleure
 * sécurité et évolutivité.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Document } = require('../models');

// Configuration du répertoire de stockage de fichiers
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Créer le répertoire d'upload s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

// Organisation des fichiers par type et date
const getStoragePath = (docType) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  const storagePath = path.join(UPLOAD_DIR, docType, `${year}-${month}`);
  
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
  
  return storagePath;
};

const fileService = {
  /**
   * Sauvegarde un fichier uploadé et crée un enregistrement Document
   * @param {Object} file - Objet fichier de Multer
   * @param {String} docType - Type de document
   * @param {String} userId - ID de l'utilisateur
   * @param {String} projectId - ID du projet (optionnel)
   * @returns {Promise<Document>} L'enregistrement Document créé
   */
  saveUploadedFile: async (file, docType, userId, projectId = null) => {
    try {
      // Générer un nom de fichier unique pour éviter les collisions
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      
      // Déterminer le chemin de stockage en fonction du type de document
      const storagePath = getStoragePath(docType);
      const filePath = path.join(storagePath, uniqueFilename);
      
      // Créer un stream de lecture du fichier temporaire
      const readStream = fs.createReadStream(file.path);
      
      // Créer un stream d'écriture vers le chemin de stockage final
      const writeStream = fs.createWriteStream(filePath);
      
      // Retourner une promesse qui se résout quand le fichier est copié
      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      
      // Supprimer le fichier temporaire une fois copié
      fs.unlinkSync(file.path);
      
      // Chemin relatif à stocker en base de données
      const relativeFilePath = path.relative(UPLOAD_DIR, filePath);
      
      // Créer l'enregistrement Document
      const document = await Document.create({
        user_id: userId,
        project_id: projectId,
        doc_type: docType,
        file_path: relativeFilePath,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        verified: false
      });
      
      return document;
    } catch (error) {
      // En cas d'erreur, s'assurer que le fichier temporaire est supprimé
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  },
  
  /**
   * Récupère un fichier par son ID de document
   * @param {String} documentId - ID du document
   * @returns {Promise<{filePath: String, mimeType: String, originalFilename: String}>}
   */
  getFileById: async (documentId) => {
    const document = await Document.findByPk(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    const absoluteFilePath = path.join(UPLOAD_DIR, document.file_path);
    
    if (!fs.existsSync(absoluteFilePath)) {
      throw new Error('File not found on disk');
    }
    
    return {
      filePath: absoluteFilePath,
      mimeType: document.mime_type,
      originalFilename: document.original_filename
    };
  },
  
  /**
   * Supprime un fichier et son enregistrement Document
   * @param {String} documentId - ID du document
   * @returns {Promise<Boolean>} - true si supprimé avec succès
   */
  deleteFile: async (documentId) => {
    const document = await Document.findByPk(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    const absoluteFilePath = path.join(UPLOAD_DIR, document.file_path);
    
    // Supprimer le fichier s'il existe
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    }
    
    // Supprimer l'enregistrement de la base de données
    await document.destroy();
    
    return true;
  }
};

module.exports = fileService;