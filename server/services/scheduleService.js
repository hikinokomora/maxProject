const universityConfig = require('../config/university.json');
const prisma = require('./db');

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

  async getSchedule(group, day = null) {
    // Try DB first
    try {
      const grp = await prisma.group.findUnique({
        where: { name: group },
        include: { lessons: { include: { teachers: true } } }
      });
      if (grp && grp.lessons?.length) {
        // group lessons by weekday
        const byDay = {};
        for (const l of grp.lessons) {
          const key = l.weekday;
          byDay[key] ||= [];
          byDay[key].push({
            time: `${l.startTime}-${l.endTime}`,
            subject: l.subject,
            room: l.room || '',
            teacher: (l.teachers?.[0]?.fullName) || ''
          });
        }
        // sort lessons by time within each day
        const result = Object.entries(byDay).map(([d, lessons]) => ({ day: d, lessons: lessons.sort((a,b)=>a.time.localeCompare(b.time)) }));
        const filtered = day ? result.filter(d => d.day.toLowerCase() === day.toLowerCase()) : result;
        if (!filtered.length) {
          return { success: false, message: `Расписание на ${day} не найдено` };
        }
        return { success: true, data: filtered };
      }
    } catch (e) {
      console.warn('[ScheduleService] DB schedule lookup failed, fallback to mock:', e.message);
    }

    // Fallback to mock
    const schedule = this.scheduleData[group];
    if (!schedule) {
      return { success: false, message: `Расписание для группы ${group} не найдено` };
    }
    if (day) {
      const daySchedule = schedule.find(s => s.day.toLowerCase() === day.toLowerCase());
      if (!daySchedule) return { success: false, message: `Расписание на ${day} не найдено` };
      return { success: true, data: [daySchedule] };
    }
    return { success: true, data: schedule };
  }

  async getAvailableGroups() {
    try {
      const groups = await prisma.group.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
      if (groups?.length) return groups.map(g => g.name);
    } catch (e) {
      console.warn('[ScheduleService] DB groups lookup failed, fallback to mock:', e.message);
    }
    return Object.keys(this.scheduleData);
  }

  async getTeacherSchedule(teacherName, day = null) {
    try {
      const teacher = await prisma.teacher.findFirst({ where: { fullName: teacherName }, include: { lessons: { include: { groups: true } } } });
      if (!teacher || !teacher.lessons?.length) return { success: false, message: `Расписание для преподавателя ${teacherName} не найдено` };
      const byDay = {};
      for (const l of teacher.lessons) {
        const key = l.weekday;
        byDay[key] ||= [];
        byDay[key].push({
          time: `${l.startTime}-${l.endTime}`,
          subject: l.subject,
          room: l.room || '',
          groups: l.groups?.map(g => g.name) || []
        });
      }
      const result = Object.entries(byDay).map(([d, lessons]) => ({ day: d, lessons: lessons.sort((a,b)=>a.time.localeCompare(b.time)) }));
      const filtered = day ? result.filter(d => d.day.toLowerCase() === day.toLowerCase()) : result;
      if (!filtered.length) return { success: false, message: `Расписание на ${day} не найдено` };
      return { success: true, data: filtered };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}

module.exports = new ScheduleService();
