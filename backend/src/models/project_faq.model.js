// backend/src/models/project_faq.model.js

/**
 * Modèle FAQ de projet pour Sequelize ORM
 * Définit la structure des questions fréquentes associées à un projet
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ProjectFAQ extends Model {}

ProjectFAQ.init({
  // Identifiant unique (UUID v4)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  // Clé étrangère vers le projet
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Question et réponse
  question: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
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
  modelName: 'ProjectFAQ',
  tableName: 'project_faq',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Note: Les associations sont définies dans un fichier séparé après l'initialisation de tous les modèles

module.exports = ProjectFAQ;