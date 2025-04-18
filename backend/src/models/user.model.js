// backend/src/models/user.model.js

/**
 * Modèle Utilisateur pour Sequelize ORM
 * Définit la structure de données utilisateur avec règles de validation
 * et méthodes pour la gestion des mots de passe
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

// Importation des modèles de profil
const InvestorProfile = require('./investor.model');
const CompanyProfile = require('./company.model');

// Nombre de tours de salage pour le hachage bcrypt
const SALT_ROUNDS = 10;

class User extends Model {
  /**
   * Compare un mot de passe candidat avec le mot de passe haché de l'utilisateur
   * @param {string} candidatePassword - Mot de passe à vérifier (en clair)
   * @returns {Promise<boolean>} - True si correspondance, false sinon
   */
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  }
}

User.init({
  // Identifiant unique (UUID v4)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  
  // Informations d'authentification
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Format d\'email invalide'
      }
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Champ virtuel pour le mot de passe (non stocké en DB)
  password: {
    type: DataTypes.VIRTUAL,
    set(value) {
      // Stocke temporairement pour traitement par les hooks
      this.setDataValue('password', value);
    }
  },
  
  // Informations personnelles
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  
  // Adresse
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  // Rôle et statut du compte
  role: {
    type: DataTypes.ENUM('admin', 'investor', 'company'),
    allowNull: false,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  
  // Profil
  profile_picture: {
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
  modelName: 'User',
  tableName: 'users',
  underscored: true, // Utilise snake_case pour les noms de colonnes
  timestamps: true,  // Active les timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  hooks: {
    /**
     * Hash le mot de passe avant création d'un utilisateur
     */
    beforeCreate: async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, SALT_ROUNDS);
      }
    },
    
    /**
     * Hash le mot de passe avant mise à jour si modifié
     */
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password_hash = await bcrypt.hash(user.password, SALT_ROUNDS);
      }
    },
    
    /**
     * Crée automatiquement le profil correspondant au rôle de l'utilisateur
     */
    afterCreate: async (user) => {
      try {
        if (user.role === 'investor') {
          await InvestorProfile.create({ user_id: user.id });
          console.log(`Profil investisseur créé pour l'utilisateur ${user.id}`);
        } else if (user.role === 'company') {
          await CompanyProfile.create({ user_id: user.id });
          console.log(`Profil entreprise créé pour l'utilisateur ${user.id}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la création du profil pour l'utilisateur ${user.id}:`, error);
      }
    }
  }
});

// Définition des associations
User.hasOne(InvestorProfile, { foreignKey: 'user_id', as: 'investorProfile' });
User.hasOne(CompanyProfile, { foreignKey: 'user_id', as: 'companyProfile' });

module.exports = User;