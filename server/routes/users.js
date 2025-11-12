const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/users - create or upsert user (admin/staff only)
router.post('/', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const { email, name, role, maxUserId } = req.body;
    const finalRole = ['STUDENT','TEACHER','STAFF','ADMIN'].includes((role||'').toUpperCase()) ? role.toUpperCase() : 'STUDENT';
    const user = await prisma.user.upsert({
      where: { email: email || 'temp_'+Date.now()+'@local' },
      update: { name, role: finalRole },
      create: { email: email || null, name, role: finalRole, maxUserId }
    });
    res.status(201).json({ success:true, data:user });
  } catch (e){
    res.status(400).json({ success:false, error:e.message });
  }
});

// GET /api/users - list users (restricted)
router.get('/', authenticateToken, requireRole('ADMIN','STAFF'), async (_req, res) => {
  try {
    const list = await prisma.user.findMany({ orderBy:{ id:'desc' } });
    res.json({ success:true, data:list });
  } catch (e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// GET /api/users/me - current user info
router.get('/me', async (req, res) => {
  try {
    if(!req.user?.id){
      return res.json({ success:true, data:{ role: req.user.role } });
    }
    const me = await prisma.user.findUnique({ where:{ id:req.user.id }});
    res.json({ success:true, data: me || { role: req.user.role }});
  } catch (e){
    res.status(500).json({ success:false, error:e.message });
  }
});

module.exports = router;
