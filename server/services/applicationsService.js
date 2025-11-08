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

  updateApplicationStatus(id, status) {
    return prisma.application.update({
      where: { id: parseInt(id) },
      data: { status }
    }).then(a => ({ success: true, message: 'Статус заявления обновлен', data: a }))
      .catch(() => ({ success: false, message: 'Заявление не найдено' }));
  }
}

module.exports = new ApplicationsService();
