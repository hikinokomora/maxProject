const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/students/me - current student's full profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        institute: true,
        direction: true,
        group: true,
        debts: true,
        user: { select: { id: true, email: true, name: true, role: true, maxUserId: true } }
      }
    });
    if (!student) return res.json({ success: true, data: null, message: 'Студентский профиль не найден' });
    res.json({ success: true, data: student });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PATCH /api/students/me - update own profile (limited)
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { studyType, instituteId, directionId, groupId, course, paid } = req.body;
    const up = await prisma.studentProfile.upsert({
      where: { userId },
      update: { studyType, instituteId, directionId, groupId, course, paid },
      create: { userId, studyType: studyType || 'BACHELOR', instituteId, directionId, groupId, course, paid: !!paid }
    });
    res.json({ success: true, data: up });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Admin endpoints: set debts, list students (optional)
router.get('/', authenticateToken, requireRole('ADMIN','STAFF'), async (_req, res) => {
  try {
    const list = await prisma.studentProfile.findMany({ include: { user: true, group: true, institute: true, direction: true } });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
