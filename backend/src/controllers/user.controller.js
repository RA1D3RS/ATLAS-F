// backend/src/controllers/user.controller.js

/**
 * Contrôleurs pour la gestion des utilisateurs et leurs profils
 */

const User = require('../models/user.model');
const InvestorProfile = require('../models/investor.model');
const CompanyProfile = require('../models/company.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Récupère le profil complet de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur avec son profil spécifique inclus
    const user = await User.findByPk(userId, {
      include: [
        { model: InvestorProfile, as: 'investorProfile' },
        { model: CompanyProfile, as: 'companyProfile' }
      ],
      attributes: {
        exclude: ['password_hash'] // Exclure le hash du mot de passe
      }
    });
    
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    
    // Déterminer quel profil est actif en fonction du rôle
    let activeProfile = null;
    if (user.role === 'investor') {
      activeProfile = user.investorProfile;
    } else if (user.role === 'company') {
      activeProfile = user.companyProfile;
    }
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          role: user.role,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          profile_picture: user.profile_picture,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        profile: activeProfile
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil utilisateur', { error: error.message });
    next(error);
  }
};

/**
 * Met à jour le profil de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }
    
    // Extraire les données pour le profil utilisateur de base
    const {
      first_name,
      last_name,
      phone,
      address,
      city,
      country,
      profile_picture,
      // Données spécifiques au profil investisseur
      investor_type,
      max_investment_amount,
      terms_accepted,
      // Données spécifiques au profil entreprise
      company_name,
      legal_status,
      registration_number,
      tax_id,
      industry_sector,
      website,
      description,
      employee_count,
      founding_date
    } = req.body;
    
    // Mise à jour des champs de l'utilisateur de base si fournis
    const userUpdateData = {};
    if (first_name !== undefined) userUpdateData.first_name = first_name;
    if (last_name !== undefined) userUpdateData.last_name = last_name;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (address !== undefined) userUpdateData.address = address;
    if (city !== undefined) userUpdateData.city = city;
    if (country !== undefined) userUpdateData.country = country;
    if (profile_picture !== undefined) userUpdateData.profile_picture = profile_picture;
    
    // Mettre à jour l'utilisateur si des données ont été fournies
    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData);
    }
    
    // Mise à jour du profil spécifique selon le rôle
    if (role === 'investor') {
      // Préparer les données de mise à jour pour le profil investisseur
      const investorUpdateData = {};
      if (investor_type !== undefined) investorUpdateData.investor_type = investor_type;
      if (max_investment_amount !== undefined) investorUpdateData.max_investment_amount = max_investment_amount;
      if (terms_accepted !== undefined) investorUpdateData.terms_accepted = terms_accepted;
      
      if (Object.keys(investorUpdateData).length > 0) {
        // Rechercher et mettre à jour le profil investisseur
        const [rowsUpdated, [updatedProfile]] = await InvestorProfile.update(investorUpdateData, {
          where: { user_id: userId },
          returning: true
        });
        
        if (rowsUpdated === 0) {
          // Si aucune mise à jour n'a été faite, créer le profil
          await InvestorProfile.create({ user_id: userId, ...investorUpdateData });
        }
      }
    } else if (role === 'company') {
      // Préparer les données de mise à jour pour le profil entreprise
      const companyUpdateData = {};
      if (company_name !== undefined) companyUpdateData.company_name = company_name;
      if (legal_status !== undefined) companyUpdateData.legal_status = legal_status;
      if (registration_number !== undefined) companyUpdateData.registration_number = registration_number;
      if (tax_id !== undefined) companyUpdateData.tax_id = tax_id;
      if (industry_sector !== undefined) companyUpdateData.industry_sector = industry_sector;
      if (website !== undefined) companyUpdateData.website = website;
      if (description !== undefined) companyUpdateData.description = description;
      if (employee_count !== undefined) companyUpdateData.employee_count = employee_count;
      if (founding_date !== undefined) companyUpdateData.founding_date = founding_date;
      
      if (Object.keys(companyUpdateData).length > 0) {
        // Rechercher et mettre à jour le profil entreprise
        const [rowsUpdated, [updatedProfile]] = await CompanyProfile.update(companyUpdateData, {
          where: { user_id: userId },
          returning: true
        });
        
        if (rowsUpdated === 0) {
          // Si aucune mise à jour n'a été faite, créer le profil
          await CompanyProfile.create({ user_id: userId, ...companyUpdateData });
        }
      }
    }
    
    // Récupérer le profil mis à jour pour le renvoyer
    const updatedUser = await User.findByPk(userId, {
      include: [
        { model: InvestorProfile, as: 'investorProfile' },
        { model: CompanyProfile, as: 'companyProfile' }
      ],
      attributes: {
        exclude: ['password_hash']
      }
    });
    
    // Déterminer quel profil est actif
    let activeProfile = null;
    if (updatedUser.role === 'investor') {
      activeProfile = updatedUser.investorProfile;
    } else if (updatedUser.role === 'company') {
      activeProfile = updatedUser.companyProfile;
    }
    
    res.json({
      status: 'success',
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          address: updatedUser.address,
          city: updatedUser.city,
          country: updatedUser.country,
          role: updatedUser.role,
          email_verified: updatedUser.email_verified,
          phone_verified: updatedUser.phone_verified,
          profile_picture: updatedUser.profile_picture,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        },
        profile: activeProfile
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil utilisateur', { error: error.message });
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile
};