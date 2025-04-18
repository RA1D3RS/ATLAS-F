// backend/src/models/company.model.js

/**
 * Modèle de profil entreprise pour Sequelize ORM
 * Définit la structure de données des profils d'entreprises
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');

class CompanyProfile extends Model {}

CompanyProfile.init({
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
  
  // Informations sur l'entreprise
  company_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  legal_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  registration_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  tax_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  industry_sector: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Format d\'URL invalide'
      }
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  employee_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  founding_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // Statut de vérification KYC
  kyc_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
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
  modelName: 'CompanyProfile',
  tableName: 'company_profiles',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Définir la relation avec le modèle User
CompanyProfile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = CompanyProfile;