const express = require('express');
const router = express.Router();
const eventsService = require('../services/eventsService');
const prisma = require('../services/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;

    let result;
    if (category) {
      result = await eventsService.getEventsByCategory(category);
    } else if (limit) {
      const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 5));
      result = await eventsService.getRecentEvents(parsedLimit);
    } else {
      result = await eventsService.getAllEvents();
    }

    res.json(result);
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventsService.getEventById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --- Admin/Staff management endpoints ---

// Create event
router.post('/', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const { title, description, date, time, location, category } = req.body;
    if (!title || !description || !date || !time || !location || !category) {
      return res.status(400).json({ success:false, error: 'title, description, date, time, location, category are required' });
    }
    const ev = await prisma.event.create({ data: { title, description, date, time, location, category } });
    res.status(201).json({ success:true, data: ev });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Update event
router.put('/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, date, time, location, category } = req.body;
    const ev = await prisma.event.update({ where: { id }, data: {
      ...(title?{title}:{}) ,
      ...(description?{description}:{}) ,
      ...(date?{date}:{}) ,
      ...(time?{time}:{}) ,
      ...(location?{location}:{}) ,
      ...(category?{category}:{})
    }});
    res.json({ success:true, data: ev });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.event.delete({ where: { id } });
    res.json({ success:true });
  } catch (e) {
    res.status(400).json({ success:false, error: e.message });
  }
});

module.exports = router;
