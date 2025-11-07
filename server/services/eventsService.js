class EventsService {
  constructor() {
    // Mock events data - в реальном приложении это будет из базы данных
    this.events = [
      {
        id: 1,
        title: 'День открытых дверей',
        description: 'Приглашаем абитуриентов и их родителей познакомиться с университетом',
        date: '2025-12-01',
        time: '10:00',
        location: 'Главный корпус, актовый зал',
        category: 'university'
      },
      {
        id: 2,
        title: 'Научная конференция студентов',
        description: 'Ежегодная конференция по итогам научно-исследовательской работы',
        date: '2025-12-05',
        time: '14:00',
        location: 'Корпус 2, конференц-зал',
        category: 'academic'
      },
      {
        id: 3,
        title: 'Спортивный турнир',
        description: 'Межфакультетский турнир по волейболу',
        date: '2025-12-10',
        time: '16:00',
        location: 'Спортивный комплекс',
        category: 'sports'
      },
      {
        id: 4,
        title: 'Мастер-класс по программированию',
        description: 'Введение в разработку мобильных приложений',
        date: '2025-12-15',
        time: '15:00',
        location: 'Корпус 3, ауд. 305',
        category: 'workshop'
      }
    ];
  }

  getAllEvents() {
    return {
      success: true,
      data: this.events
    };
  }

  getEventById(id) {
    const event = this.events.find(e => e.id === parseInt(id));
    if (!event) {
      return {
        success: false,
        message: 'Мероприятие не найдено'
      };
    }
    return {
      success: true,
      data: event
    };
  }

  getEventsByCategory(category) {
    const filteredEvents = this.events.filter(e => e.category === category);
    return {
      success: true,
      data: filteredEvents
    };
  }

  getUpcomingEvents(limit = 5) {
    // В реальном приложении здесь будет фильтрация по дате
    return {
      success: true,
      data: this.events.slice(0, limit)
    };
  }
}

module.exports = new EventsService();
