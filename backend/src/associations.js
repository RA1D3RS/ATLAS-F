// backend/src/models/associations.js

/**
 * Ce fichier centralise toutes les associations entre les modèles
 * pour éviter les problèmes de dépendances cycliques
 */

// Importation de tous les modèles
const User = require('./user.model');
const InvestorProfile = require('./investor.model');
const CompanyProfile = require('./company.model');
const Document = require('./document.model');
const Project = require('./project.model');

// Associations User
User.hasOne(InvestorProfile, { foreignKey: 'user_id', as: 'investorProfile' });
User.hasOne(CompanyProfile, { foreignKey: 'user_id', as: 'companyProfile' });
User.hasMany(Document, { foreignKey: 'user_id' });
User.hasMany(Project, { as: 'ReviewedProjects', foreignKey: 'reviewer_id' });

// Associations InvestorProfile
InvestorProfile.belongsTo(User, { foreignKey: 'user_id' });

// Associations CompanyProfile
CompanyProfile.belongsTo(User, { foreignKey: 'user_id' });
CompanyProfile.hasMany(Project, { foreignKey: 'company_id' });

// Associations Document
Document.belongsTo(User, { foreignKey: 'user_id' });

// Associations Project
Project.belongsTo(CompanyProfile, { foreignKey: 'company_id' });
Project.belongsTo(User, { as: 'Reviewer', foreignKey: 'reviewer_id' });

module.exports = {
  User,
  InvestorProfile,
  CompanyProfile,
  Document,
  Project
};