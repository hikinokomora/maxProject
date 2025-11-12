const express = require('express');
const router = express.Router();
const scheduleService = require('../services/scheduleService');
const prisma = require('../services/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/schedule - Get schedule
router.get('/', async (req, res) => {
  try {
    const { group, teacher, day } = req.query;

    if (!group && !teacher) {
      return res.status(400).json({ success: false, error: 'Provide either group or teacher query parameter' });
    }

    const result = group
      ? await scheduleService.getSchedule(group, day)
      : await scheduleService.getTeacherSchedule(teacher, day);
    res.json(result);
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/schedule/groups - Get available groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await scheduleService.getAvailableGroups();
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --- Admin/Staff management endpoints ---

// Create group
router.post('/groups', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const { name, course, directionId } = req.body;
    if (!name || !course || !directionId) {
      return res.status(400).json({ success:false, error: 'name, course, directionId are required' });
    }
    const group = await prisma.group.create({ data: { name, course: Number(course), directionId: Number(directionId) } });
    res.status(201).json({ success:true, data: group });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Update group
router.put('/groups/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, course, directionId } = req.body;
    const group = await prisma.group.update({ where: { id }, data: {
      ...(name ? { name } : {}),
      ...(course ? { course: Number(course) } : {}),
      ...(directionId ? { directionId: Number(directionId) } : {})
    }});
    res.json({ success:true, data: group });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Delete group
router.delete('/groups/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.group.delete({ where: { id } });
    res.json({ success:true });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Create teacher
router.post('/teachers', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const { fullName, department } = req.body;
    if (!fullName) return res.status(400).json({ success:false, error: 'fullName is required' });
    const teacher = await prisma.teacher.create({ data: { fullName, department } });
    res.status(201).json({ success:true, data: teacher });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Update teacher
router.put('/teachers/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, department } = req.body;
    const teacher = await prisma.teacher.update({ where: { id }, data: { ...(fullName?{fullName}:{}) , ...(department?{department}:{}) } });
    res.json({ success:true, data: teacher });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Delete teacher
router.delete('/teachers/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.teacher.delete({ where: { id } });
    res.json({ success:true });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Create lesson and attach relations
router.post('/lessons', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const { weekday, startTime, endTime, subject, room, type, groupIds = [], groupNames = [], teacherIds = [], teacherNames = [] } = req.body;
    if (!weekday || !startTime || !endTime || !subject) {
      return res.status(400).json({ success:false, error: 'weekday, startTime, endTime, subject are required' });
    }

    // Resolve groups by names if provided
    let groupsToConnect = (groupIds || []).map(id => ({ id: Number(id) }));
    if (groupNames?.length) {
      const groups = await prisma.group.findMany({ where: { name: { in: groupNames } }, select: { id: true } });
      groupsToConnect = groupsToConnect.concat(groups.map(g => ({ id: g.id })));
    }

    // Resolve teachers by names if provided
    let teachersToConnect = (teacherIds || []).map(id => ({ id: Number(id) }));
    if (teacherNames?.length) {
      const teachers = await prisma.teacher.findMany({ where: { fullName: { in: teacherNames } }, select: { id: true } });
      teachersToConnect = teachersToConnect.concat(teachers.map(t => ({ id: t.id })));
    }

    const lesson = await prisma.lesson.create({
      data: {
        weekday, startTime, endTime, subject, room, type,
        ...(groupsToConnect.length ? { groups: { connect: groupsToConnect } } : {}),
        ...(teachersToConnect.length ? { teachers: { connect: teachersToConnect } } : {}),
      },
      include: { groups: true, teachers: true }
    });
    res.status(201).json({ success:true, data: lesson });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Update lesson and relations
router.put('/lessons/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { weekday, startTime, endTime, subject, room, type, groupIds = [], teacherIds = [] } = req.body;

    const data = {
      ...(weekday ? { weekday } : {}),
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
      ...(subject ? { subject } : {}),
      ...(room ? { room } : {}),
      ...(type ? { type } : {}),
    };

    if (Array.isArray(groupIds)) {
      data.groups = { set: [], ...(groupIds.length ? { connect: groupIds.map(i => ({ id: Number(i) })) } : {}) };
    }
    if (Array.isArray(teacherIds)) {
      data.teachers = { set: [], ...(teacherIds.length ? { connect: teacherIds.map(i => ({ id: Number(i) })) } : {}) };
    }

    const lesson = await prisma.lesson.update({ where: { id }, data, include: { groups: true, teachers: true } });
    res.json({ success:true, data: lesson });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Delete lesson
router.delete('/lessons/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.lesson.delete({ where: { id } });
    res.json({ success:true });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

module.exports = router;
