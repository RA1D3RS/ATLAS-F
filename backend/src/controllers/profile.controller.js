// backend/src/controllers/profile.controller.js

/**
 * Contrôleurs pour la gestion des profils utilisateurs
 */

const InvestorProfile = require('../models/investor.model');
const CompanyProfile = require('../models/company.model');
const User = require('../models/user.model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Récupère le profil de l'utilisateur connecté en fonction de son rôle
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    
    let profile;
    
    if (user.role === 'investor') {
      profile = await InvestorProfile.findOne({ where: { user_id: userId } });
    } else if (user.role === 'company') {
      profile = await CompanyProfile.findOne({ where: { user_id: userId } });
    } else {
      throw new BadRequestError('Rôle utilisateur non valide pour récupérer un profil');
    }
    
    // Si aucun profil n'existe, en créer un par défaut
    if (!profile) {
      if (user.role === 'investor') {
        profile = await InvestorProfile.create({ user_id: userId });
      } else if (user.role === 'company') {
        profile = await CompanyProfile.create({ user_id: userId });
      }
    }
    
    // Inclure certaines informations de base de l'utilisateur
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified
      },
      profile: profile
    };
    
    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Met à jour le profil investisseur de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const updateInvestorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    
    // Vérifier si l'utilisateur est bien un investisseur
    if (user.role !== 'investor') {
      throw new ForbiddenError('Vous devez être un investisseur pour mettre à jour ce profil');
    }
    
    // Récupérer ou créer le profil
    let profile = await InvestorProfile.findOne({ where: { user_id: userId } });
    if (!profile) {
      profile = await InvestorProfile.create({ user_id: userId });
    }
    
    // Extraire les champs à mettre à jour
    const {
      investor_type,
      max_investment_amount,
      terms_accepted
    } = req.body;
    
    // Mettre à jour le profil avec les nouvelles données
    await profile.update({
      investor_type: investor_type !== undefined ? investor_type : profile.investor_type,
      max_investment_amount: max_investment_amount !== undefined ? max_investment_amount : profile.max_investment_amount,
      terms_accepted: terms_accepted !== undefined ? terms_accepted : profile.terms_accepted
    });
    
    // Récupérer le profil mis à jour
    const updatedProfile = await InvestorProfile.findOne({ where: { user_id: userId } });
    
    res.json({
      status: 'success',
      message: 'Profil investisseur mis à jour avec succès',
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil investisseur', { error: error.message });
    next(error);
  }
};

/**
 * Met à jour le profil entreprise de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const updateCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    
    // Vérifier si l'utilisateur est bien une entreprise
    if (user.role !== 'company') {
      throw new ForbiddenError('Vous devez être une entreprise pour mettre à jour ce profil');
    }
    
    // Récupérer ou créer le profil
    let profile = await CompanyProfile.findOne({ where: { user_id: userId } });
    if (!profile) {
      profile = await CompanyProfile.create({ user_id: userId });
    }
    
    // Extraire les champs à mettre à jour
    const {
      company_name,
      legal_status,
      registration_number,
      tax_id,
      industry_sector,
      website,
      description,
      employee_count,
      founding_date,
      address,
      city
    } = req.body;
    
    // Mettre à jour le profil avec les nouvelles données
    await profile.update({
      company_name: company_name !== undefined ? company_name : profile.company_name,
      legal_status: legal_status !== undefined ? legal_status : profile.legal_status,
      registration_number: registration_number !== undefined ? registration_number : profile.registration_number,
      tax_id: tax_id !== undefined ? tax_id : profile.tax_id,
      industry_sector: industry_sector !== undefined ? industry_sector : profile.industry_sector,
      website: website !== undefined ? website : profile.website,
      description: description !== undefined ? description : profile.description,
      employee_count: employee_count !== undefined ? employee_count : profile.employee_count,
      founding_date: founding_date !== undefined ? founding_date : profile.founding_date,
      address: address !== undefined ? address : profile.address,
      city: city !== undefined ? city : profile.city
    });
    
    // Récupérer le profil mis à jour
    const updatedProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    res.json({
      status: 'success',
      message: 'Profil entreprise mis à jour avec succès',
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil entreprise', { error: error.message });
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateInvestorProfile,
  updateCompanyProfile
};