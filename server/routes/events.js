const express = require('express');
const router = express.Router();
const eventsService = require('../services/eventsService');

// GET /api/events - Get all events
router.get('/', (req, res) => {
  try {
    const { category, limit } = req.query;

    let result;
    if (category) {
      result = eventsService.getEventsByCategory(category);
    } else if (limit) {
      result = eventsService.getUpcomingEvents(parseInt(limit));
    } else {
      result = eventsService.getAllEvents();
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = eventsService.getEventById(id);
    
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

module.exports = router;
