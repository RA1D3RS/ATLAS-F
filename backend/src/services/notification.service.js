// backend/src/services/notificationService.js

/**
 * Service de notification pour informer les entreprises des changements de statut
 */

/**
 * Notifie une entreprise du changement de statut de son projet
 * @param {Object} company - Informations de l'entreprise
 * @param {Object} project - Projet concerné
 * @param {String} status - Nouveau statut (approved/rejected)
 */
const notifyProjectStatusChange = async (company, project, status) => {
  try {
    // Placeholder pour l'implémentation future
    console.log(`[NOTIFICATION] Envoi de notification à ${company.email}`);
    console.log(`Projet "${project.title}" - Statut: ${status}`);
    
    // TODO: Implémenter l'envoi d'email/SMS/notification push
    // Exemples d'implémentation possibles:
    
    // 1. Email via service comme SendGrid, Nodemailer, etc.
    // await emailService.sendProjectStatusNotification({
    //   to: company.email,
    //   companyName: company.name,
    //   projectTitle: project.title,
    //   status: status,
    //   reviewNotes: project.review_notes,
    //   riskRating: project.risk_rating
    // });

    // 2. Notification push via service comme Firebase
    // await pushNotificationService.send({
    //   userId: company.user_id,
    //   title: `Projet ${status === 'approved' ? 'Approuvé' : 'Rejeté'}`,
    //   body: `Votre projet "${project.title}" a été ${status === 'approved' ? 'approuvé' : 'rejeté'}`
    // });

    // 3. SMS via service comme Twilio
    // if (company.phone) {
    //   await smsService.send({
    //     to: company.phone,
    //     message: `Votre projet "${project.title}" a été ${status === 'approved' ? 'approuvé' : 'rejeté'}. Consultez votre espace client pour plus de détails.`
    //   });
    // }

    return {
      success: true,
      message: 'Notification envoyée avec succès',
      recipient: company.email,
      projectId: project._id,
      status: status
    };

  } catch (error) {
    console.error('Erreur lors de l\'envoi de notification:', error);
    throw new Error(`Échec de l'envoi de notification: ${error.message}`);
  }
};

/**
 * Crée un message personnalisé selon le statut du projet
 * @param {String} status - Statut du projet
 * @param {Object} project - Informations du projet
 * @returns {Object} Objet contenant le sujet et le corps du message
 */
const createStatusMessage = (status, project) => {
  const baseMessages = {
    approved: {
      subject: `✅ Projet "${project.title}" approuvé`,
      body: `Félicitations ! Votre projet "${project.title}" a été approuvé par notre équipe.`
    },
    rejected: {
      subject: `❌ Projet "${project.title}" rejeté`,
      body: `Nous regrettons de vous informer que votre projet "${project.title}" n'a pas été approuvé.`
    }
  };

  let message = baseMessages[status] || {
    subject: `Mise à jour du projet "${project.title}"`,
    body: `Le statut de votre projet "${project.title}" a été mis à jour.`
  };

  // Ajouter les notes de revue si disponibles
  if (project.review_notes) {
    message.body += `\n\nCommentaires de l'équipe de revue:\n${project.review_notes}`;
  }

  // Ajouter la note de risque si disponible
  if (project.risk_rating) {
    message.body += `\n\nNote de risque attribuée: ${project.risk_rating}/5`;
  }

  return message;
};

module.exports = {
  notifyProjectStatusChange,
  createStatusMessage
};