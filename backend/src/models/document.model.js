// backend/src/models/document.model.js

/**
 * Modèle Document pour Sequelize ORM
 * Définit la structure des documents associés aux utilisateurs et aux projets
 * (KYC, business plans, etc.)
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Document extends Model {}

Document.init({
  // Identifiant unique (UUID v4)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  // Clé étrangère vers l'utilisateur qui a uploadé le document
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Clé étrangère vers le projet (optionnel)
  project_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Type de document
  doc_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'id_card, passport, company_registration, business_plan, financial_statements, etc.'
  },
  
  // Informations sur le fichier
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  // Vérification du document
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  
  verification_notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // Timestamps gérés par Sequelize
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'Document',
  tableName: 'documents',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Note: Les associations sont définies dans un fichier séparé après l'initialisation de tous les modèles

module.exports = Document;