const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/analytics/dashboard - Get dashboard statistics (admin only)
router.get('/dashboard', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    // Общая статистика
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalApplications = await prisma.application.count();
    const totalEvents = await prisma.event.count();
    
    // Статистика по заявлениям
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    // Статистика по типам заявлений
    const applicationsByType = await prisma.application.groupBy({
      by: ['typeName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    // Последние заявления
    const recentApplications = await prisma.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    
    // Активные студенты (с заявлениями за последний месяц)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const activeStudents = await prisma.application.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: oneMonthAgo }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });
    
    // Получаем имена активных студентов
    const activeStudentsList = await Promise.all(
      activeStudents.map(async (s) => {
        const user = await prisma.user.findUnique({ 
          where: { id: s.userId },
          select: { name: true, email: true }
        });
        return { ...user, applicationsCount: s._count.id };
      })
    );
    
    // Статистика по группам
    const groupStats = await prisma.group.findMany({
      include: {
        _count: { select: { students: true } },
        direction: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    // Академические долги
    const totalDebts = await prisma.academicDebt.count({ where: { closed: false } });
    const debtsBySubject = await prisma.academicDebt.groupBy({
      by: ['subject'],
      where: { closed: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalStudents,
          totalApplications,
          totalEvents,
          totalDebts
        },
        applications: {
          byStatus: applicationsByStatus.map(s => ({
            status: s.status,
            count: s._count.id
          })),
          byType: applicationsByType.map(t => ({
            type: t.typeName,
            count: t._count.id
          })),
          recent: recentApplications.map(a => ({
            id: a.id,
            type: a.typeName,
            student: a.user.name,
            status: a.status,
            createdAt: a.createdAt
          }))
        },
        students: {
          active: activeStudentsList,
          byGroup: groupStats.map(g => ({
            group: g.name,
            direction: g.direction.name,
            studentsCount: g._count.students
          }))
        },
        debts: {
          total: totalDebts,
          bySubject: debtsBySubject.map(d => ({
            subject: d.subject,
            count: d._count.id
          }))
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/analytics/activity - Get activity heatmap data
router.get('/activity', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const applications = await prisma.application.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: { createdAt: true }
    });
    
    // Группируем по дням и часам
    const activityMap = {};
    applications.forEach(app => {
      const date = new Date(app.createdAt);
      const day = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      if (!activityMap[day]) activityMap[day] = {};
      if (!activityMap[day][hour]) activityMap[day][hour] = 0;
      activityMap[day][hour]++;
    });
    
    res.json({
      success: true,
      data: activityMap
    });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/analytics/trends - Get trends over time
router.get('/trends', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    
    let groupBy;
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const applications = await prisma.application.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' }
    });
    
    // Группируем по дням
    const trends = {};
    applications.forEach(app => {
      const date = app.createdAt.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      trends[date].total++;
      trends[date][app.status]++;
    });
    
    res.json({
      success: true,
      data: Object.entries(trends).map(([date, stats]) => ({
        date,
        ...stats
      }))
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/analytics/performance - Get average processing time
router.get('/performance', authenticateToken, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        status: { in: ['approved', 'rejected'] }
      },
      select: { createdAt: true, updatedAt: true, status: true, typeName: true }
    });
    
    // Вычисляем среднее время обработки
    const processingTimes = applications.map(app => {
      const diff = app.updatedAt.getTime() - app.createdAt.getTime();
      return {
        type: app.typeName,
        status: app.status,
        hours: diff / (1000 * 60 * 60)
      };
    });
    
    // Группируем по типам
    const avgByType = {};
    processingTimes.forEach(pt => {
      if (!avgByType[pt.type]) {
        avgByType[pt.type] = { total: 0, count: 0 };
      }
      avgByType[pt.type].total += pt.hours;
      avgByType[pt.type].count++;
    });
    
    const averages = Object.entries(avgByType).map(([type, data]) => ({
      type,
      averageHours: (data.total / data.count).toFixed(2)
    }));
    
    const overallAvg = processingTimes.length > 0
      ? (processingTimes.reduce((sum, pt) => sum + pt.hours, 0) / processingTimes.length).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      data: {
        overall: overallAvg,
        byType: averages,
        totalProcessed: applications.length
      }
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
