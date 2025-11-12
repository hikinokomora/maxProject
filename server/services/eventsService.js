const prisma = require('./db');

class EventsService {
  async getAllEvents() {
    try {
      const events = await prisma.event.findMany({ orderBy: { date: 'asc' } });
      return { success: true, data: events };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async getEventById(id) {
    try {
      const event = await prisma.event.findUnique({ where: { id: parseInt(id) } });
      if (!event) return { success: false, message: 'Мероприятие не найдено' };
      return { success: true, data: event };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async getEventsByCategory(category) {
    try {
      const events = await prisma.event.findMany({ where: { category } });
      return { success: true, data: events };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async getRecentEvents(limit = 5) {
    try {
      const events = await prisma.event.findMany({ take: limit, orderBy: { date: 'asc' } });
      return { success: true, data: events };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}

module.exports = new EventsService();
