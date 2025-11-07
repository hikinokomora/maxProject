const universityConfig = require('../config/university.json');

class ScheduleService {
  constructor() {
    this.config = universityConfig;
    // Mock schedule data - в реальном приложении это будет из базы данных
    this.scheduleData = {
      'ИВТ-101': [
        {
          day: 'Понедельник',
          lessons: [
            { time: '09:00-10:30', subject: 'Математический анализ', room: '201', teacher: 'Иванов И.И.' },
            { time: '10:45-12:15', subject: 'Программирование', room: '305', teacher: 'Петров П.П.' },
            { time: '13:00-14:30', subject: 'Английский язык', room: '410', teacher: 'Сидорова С.С.' }
          ]
        },
        {
          day: 'Вторник',
          lessons: [
            { time: '09:00-10:30', subject: 'Физика', room: '150', teacher: 'Федоров Ф.Ф.' },
            { time: '10:45-12:15', subject: 'Базы данных', room: '305', teacher: 'Петров П.П.' }
          ]
        }
      ]
    };
  }

  getSchedule(group, day = null) {
    const schedule = this.scheduleData[group];
    
    if (!schedule) {
      return {
        success: false,
        message: `Расписание для группы ${group} не найдено`
      };
    }

    if (day) {
      const daySchedule = schedule.find(s => s.day.toLowerCase() === day.toLowerCase());
      if (!daySchedule) {
        return {
          success: false,
          message: `Расписание на ${day} не найдено`
        };
      }
      return {
        success: true,
        data: [daySchedule]
      };
    }

    return {
      success: true,
      data: schedule
    };
  }

  getAvailableGroups() {
    return Object.keys(this.scheduleData);
  }
}

module.exports = new ScheduleService();
