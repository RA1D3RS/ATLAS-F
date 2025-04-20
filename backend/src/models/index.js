// backend/src/models/index.js

/**
 * Fichier central pour établir les associations entre les modèles Sequelize
 * Importe tous les modèles et définit leurs relations
 */

// Import des modèles
const User = require('./user.model');
const CompanyProfile = require('./company.model');
const InvestorProfile = require('./investor.model');
const Project = require('./project.model');
const ProjectTeam = require('./project_team.model');
const ProjectFAQ = require('./project_faq.model');
const Reward = require('./reward.model');
const Document = require('./document.model');

// Définition des associations

// Relations User
User.hasOne(CompanyProfile, { foreignKey: 'user_id', as: 'companyProfile' });
User.hasOne(InvestorProfile, { foreignKey: 'user_id', as: 'investorProfile' });
User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
User.hasMany(Project, { foreignKey: 'reviewer_id', as: 'reviewedProjects' });

// Relations CompanyProfile
CompanyProfile.belongsTo(User, { foreignKey: 'user_id' });
CompanyProfile.hasMany(Project, { foreignKey: 'company_id', as: 'projects' });

// Relations InvestorProfile
InvestorProfile.belongsTo(User, { foreignKey: 'user_id' });
// Note: Les relations avec les transactions seront définies ultérieurement

// Relations Project
Project.belongsTo(CompanyProfile, { foreignKey: 'company_id', as: 'companyProfile' });
Project.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Project.hasMany(ProjectTeam, { foreignKey: 'project_id', as: 'teamMembers' });
Project.hasMany(ProjectFAQ, { foreignKey: 'project_id', as: 'faqs' });
Project.hasMany(Reward, { foreignKey: 'project_id', as: 'rewards' });
Project.hasMany(Document, { foreignKey: 'project_id', as: 'documents' });

// Relations ProjectTeam
ProjectTeam.belongsTo(Project, { foreignKey: 'project_id' });

// Relations ProjectFAQ
ProjectFAQ.belongsTo(Project, { foreignKey: 'project_id' });

// Relations Reward
Reward.belongsTo(Project, { foreignKey: 'project_id' });

// Relations Document
Document.belongsTo(User, { foreignKey: 'user_id', as: 'uploader' });
Document.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Export des modèles avec leurs associations
module.exports = {
  User,
  CompanyProfile,
  InvestorProfile,
  Project,
  ProjectTeam,
  ProjectFAQ,
  Reward,
  Document
};