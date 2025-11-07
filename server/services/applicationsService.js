const universityConfig = require('../config/university.json');

class ApplicationsService {
  constructor() {
    this.config = universityConfig;
    // Mock storage - в реальном приложении это будет база данных
    this.applications = [];
    // Use timestamp-based IDs for better uniqueness
    this.nextId = Date.now();
  }

  generateId() {
    return this.nextId++;
  }

  createApplication(data) {
    const { type, studentName, studentId, department, description, email } = data;

    // Validate required fields
    if (!type || !studentName || !studentId || !email) {
      return {
        success: false,
        message: 'Пожалуйста, заполните все обязательные поля'
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

    const application = {
      id: this.generateId(),
      type,
      typeName: validType.name,
      studentName,
      studentId,
      department,
      description,
      email,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.applications.push(application);

    return {
      success: true,
      message: `Заявление №${application.id} успешно создано. Статус заявления будет отправлен на email: ${email}`,
      data: application
    };
  }

  getApplicationById(id) {
    const application = this.applications.find(a => a.id === parseInt(id));
    if (!application) {
      return {
        success: false,
        message: 'Заявление не найдено'
      };
    }
    return {
      success: true,
      data: application
    };
  }

  getApplicationsByStudentId(studentId) {
    const studentApplications = this.applications.filter(a => a.studentId === studentId);
    return {
      success: true,
      data: studentApplications
    };
  }

  getApplicationTypes() {
    return {
      success: true,
      data: this.config.applicationTypes
    };
  }

  updateApplicationStatus(id, status) {
    const application = this.applications.find(a => a.id === parseInt(id));
    if (!application) {
      return {
        success: false,
        message: 'Заявление не найдено'
      };
    }

    application.status = status;
    application.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: 'Статус заявления обновлен',
      data: application
    };
  }
}

module.exports = new ApplicationsService();
