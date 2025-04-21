// backend/src/utils/project_permissions.js

const { Project, CompanyProfile } = require('../models');

/**
 * Vérifie l'accès d'un utilisateur à un projet spécifique
 *
 * @param {string} projectId - L'ID UUID du projet à vérifier
 * @param {string} userId - L'ID UUID de l'utilisateur demandant l'accès
 * @param {Array<string>} allowedStatuses - Liste des statuts de projet autorisés pour l'action
 * @returns {Promise<Project>} - Retourne l'instance du projet si l'accès est autorisé
 * @throws {Error} - Lève une erreur avec un message approprié et un code d'erreur si l'accès est refusé
 */
exports.checkProjectAccess = async (projectId, userId, allowedStatuses) => {
  // Récupérer le projet par son ID
  const project = await Project.findByPk(projectId);
  
  // Vérifier que le projet existe
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    error.code = 'PROJECT_NOT_FOUND';
    throw error;
  }
  
  // Trouver le profil d'entreprise associé à l'utilisateur
  const companyProfile = await CompanyProfile.findOne({
    where: { user_id: userId }
  });
  
  // Vérifier que l'utilisateur possède une entreprise et qu'il est propriétaire du projet
  if (!companyProfile || project.company_id !== companyProfile.id) {
    const error = new Error('Access denied. You are not the owner of this project.');
    error.statusCode = 403;
    error.code = 'AUTH_NOT_PROJECT_OWNER';
    throw error;
  }
  
  // Vérifier que le statut du projet permet l'action demandée
  if (allowedStatuses && !allowedStatuses.includes(project.status)) {
    const error = new Error(`Action not allowed for project with status '${project.status}'.`);
    error.statusCode = 403;
    error.code = 'PROJECT_STATUS_NOT_ALLOWED';
    throw error;
  }
  
  // Retourner le projet validé pour un traitement ultérieur
  return project;
};