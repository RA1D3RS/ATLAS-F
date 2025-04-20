// backend/src/models/reward.model.js

/**
 * Modèle Récompense pour Sequelize ORM
 * Définit la structure des contreparties offertes pour les dons
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Reward extends Model {}

Reward.init({
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
  
  // Informations sur la récompense
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  
  min_donation: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  
  quantity_available: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  quantity_claimed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  estimated_delivery: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  shipping_restrictions: {
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
  modelName: 'Reward',
  tableName: 'rewards',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Note: Les associations sont définies dans un fichier séparé après l'initialisation de tous les modèles

module.exports = Reward;