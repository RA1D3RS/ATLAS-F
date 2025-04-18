// backend/src/models/index.js

const User = require('./user.model');
const InvestorProfile = require('./investor.model');
const CompanyProfile = require('./company.model');

// Configuration des associations
User.hasOne(InvestorProfile, { foreignKey: 'user_id', as: 'investorProfile' });
InvestorProfile.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(CompanyProfile, { foreignKey: 'user_id', as: 'companyProfile' });
CompanyProfile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  InvestorProfile,
  CompanyProfile
};