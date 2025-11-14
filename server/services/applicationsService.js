const universityConfig = require('../config/university.json');
const prisma = require('./db');

class ApplicationsService {
  constructor() {
    this.config = universityConfig;
  }

  /**
   * Create new application
   * @param {Object} data - Application data
   * @param {number} data.userId - Database user ID (required for linking)
   * @returns {Promise<{success: boolean, message?: string, data?: Object}>}
   */
  async createApplication(data) {
    const { type, studentName, studentId, department, description, email, userId } = data;

    // Validate required fields
    if (!type || !studentName || !studentId || !email) {
      return {
        success: false,
        message: 'Пожалуйста, заполните все обязательные поля'
      };
    }

    // userId is now required for proper linking
    if (!userId) {
      return {
        success: false,
        message: 'User must be authenticated to submit application'
      };
    }

    // Validate application type
    const validType = this.config.applicationTypes.find(t => t.id === type);
    if (!validType) {
      return {
        success: false,
        message: 'Неверный тип заявления'
      };
    }

    try {
      const application = await prisma.application.create({
        data: {
          type,
          typeName: validType.name,
          studentName,
          studentId,
          department,
          description,
          email,
          status: 'pending',
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });

      return {
        success: true,
        message: `Заявление №${application.id} успешно создано. Статус заявления будет отправлен на email: ${email}`,
        data: application
      };
    } catch (e) {
      console.error('[ApplicationsService] Create error:', e);
      return { success: false, message: e.message };
    }
  }

  getApplicationById(id) {
    return prisma.application.findUnique({ 
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })
      .then(app => app ? ({ success: true, data: app }) : ({ success: false, message: 'Заявление не найдено' }))
      .catch(e => ({ success: false, message: e.message }));
  }

  getApplicationsByStudentId(studentId) {
    return prisma.application.findMany({ 
      where: { studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })
      .then(list => ({ success: true, data: list }))
      .catch(e => ({ success: false, message: e.message }));
  }

  getApplicationsByUserId(userId) {
    return prisma.application.findMany({ 
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
      .then(list => ({ success: true, data: list }))
      .catch(e => ({ success: false, message: e.message }));
  }

  /**
   * Get all applications (for teachers/staff - shows real student names)
   * @param {Object} filters - Optional filters
   * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
   */
  async getAllApplications(filters = {}) {
    try {
      const where = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.department) {
        where.department = filters.department;
      }

      const applications = await prisma.application.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return { success: true, data: applications };
    } catch (e) {
      console.error('[ApplicationsService] Get all error:', e);
      return { success: false, message: e.message };
    }
  }

  getApplicationTypes() {
    return {
      success: true,
      data: this.config.applicationTypes
    };
  }

  async updateApplicationStatus(id, status, adminName = 'Администратор') {
    try {
      const application = await prisma.application.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { user: true }
      });
      
      // Отправляем уведомление студенту
      if (application.user?.maxUserId) {
        const maxBotService = require('./maxBotService');
        if (global.maxBotInstance) {
          await this.sendStatusNotification(global.maxBotInstance, application, adminName);
        }
      }
      
      return { success: true, message: 'Статус заявления обновлен', data: application };
    } catch (e) {
      return { success: false, message: 'Заявление не найдено' };
    }
  }
  
  async sendStatusNotification(botInstance, application, adminName) {
    try {
      const statusEmoji = {
        'pending': '🕐',
        'approved': '✅',
        'rejected': '❌',
        'processing': '⚙️'
      };
      
      const statusText = {
        'pending': 'В обработке',
        'approved': 'Одобрено',
        'rejected': 'Отклонено',
        'processing': 'В работе'
      };
      
      const emoji = statusEmoji[application.status] || '📋';
      const status = statusText[application.status] || application.status;
      
      const message = 
        `🔔 *Обновление статуса заявления*\n\n` +
        `${emoji} Заявление №${application.id}\n` +
        `Тип: ${application.typeName}\n` +
        `Новый статус: *${status}*\n\n` +
        `Обработал: ${adminName}\n\n` +
        `Для подробностей отправьте: Статус заявления ${application.id}`;
      
      await botInstance.bot.sendMessage(application.user.maxUserId, {
        text: message,
        format: 'markdown'
      });
      
      console.log(`[Notification] Sent status update to user ${application.user.maxUserId} for application #${application.id}`);
    } catch (e) {
      console.error('[Notification] Failed to send notification:', e.message);
    }
  }
}

module.exports = new ApplicationsService();
