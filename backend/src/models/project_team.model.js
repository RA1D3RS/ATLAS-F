// backend/src/models/project_team.model.js

/**
 * Modèle membres d'équipe de projet pour Sequelize ORM
 * Définit la structure des membres d'équipe associés à un projet
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ProjectTeam extends Model {}

ProjectTeam.init({
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
  
  // Informations sur le membre d'équipe
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  position: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  linkedin_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Format d\'URL LinkedIn invalide'
      }
    }
  },
  
  photo_path: {
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
  modelName: 'ProjectTeam',
  tableName: 'project_team',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Note: Les associations sont définies dans un fichier séparé après l'initialisation de tous les modèles

module.exports = ProjectTeam;