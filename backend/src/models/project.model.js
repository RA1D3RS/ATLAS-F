// backend/src/models/project.model.js

/**
 * Modèle Projet pour Sequelize ORM
 * Définit la structure des projets de financement
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Project extends Model {}

Project.init({
  // Identifiant unique (UUID v4)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  // Clé étrangère vers le profil d'entreprise
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'company_profiles',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Informations sur le projet
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  short_description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  full_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  
  funding_goal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  
  min_investment: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  
  funding_type: {
    type: DataTypes.ENUM('equity', 'donation'),
    allowNull: false,
  },
  
  equity_structure: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  status: {
    type: DataTypes.ENUM(
      'draft', 
      'submitted', 
      'under_review', 
      'approved', 
      'rejected', 
      'active', 
      'funded', 
      'failed'
    ),
    defaultValue: 'draft',
    allowNull: false,
  },
  
  industry_sector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  impact_type: {
    type: DataTypes.ENUM('social', 'environmental', 'both', 'none'),
    allowNull: false,
  },
  
  video_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Format d\'URL invalide'
      }
    }
  },
  
  image_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  // Révision et validation
  reviewer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  risk_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  
  review_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  platform_fee_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0,
      max: 100
    }
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
  modelName: 'Project',
  tableName: 'projects',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Note: Les associations sont définies dans un fichier séparé après l'initialisation de tous les modèles
// pour éviter les problèmes de dépendances circulaires

module.exports = Project;