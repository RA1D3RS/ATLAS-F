// backend/src/models/investor.model.js

/**
 * Modèle de profil investisseur pour Sequelize ORM
 * Définit la structure de données des profils investisseurs
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');

class InvestorProfile extends Model {}

InvestorProfile.init({
  // Identifiant unique (UUID v4)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  // Clé étrangère vers l'utilisateur
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Type d'investisseur
  investor_type: {
    type: DataTypes.ENUM('retail', 'professional', 'institutional', 'diaspora'),
    allowNull: true,
  },
  
  // Statut de vérification KYC
  kyc_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  
  // Montant maximum d'investissement
  max_investment_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  
  // Acceptation des termes et conditions
  terms_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  modelName: 'InvestorProfile',
  tableName: 'investor_profiles',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Définir la relation avec le modèle User
InvestorProfile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = InvestorProfile;