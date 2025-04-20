// backend/src/models/index.js

/**
 * Point d'entrée central pour tous les modèles
 * Configure les associations entre les modèles
 */

const User = require('./user.model');
const InvestorProfile = require('./investor.model');
const CompanyProfile = require('./company.model');
const Document = require('./document.model');
const Project = require('./project.model');

// Regrouper tous les modèles
const models = {
  User,
  InvestorProfile,
  CompanyProfile,
  Document,
  Project
};

// Exécuter les fonctions associate si elles existent
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;