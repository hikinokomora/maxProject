const express = require('express');
const router = express.Router();
const scheduleService = require('../services/scheduleService');

// GET /api/schedule - Get schedule
router.get('/', (req, res) => {
  try {
    const { group, day } = req.query;

    if (!group) {
      return res.status(400).json({
        success: false,
        error: 'Group parameter is required'
      });
    }

    const result = scheduleService.getSchedule(group, day);
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
router.get('/groups', (req, res) => {
  try {
    const groups = scheduleService.getAvailableGroups();
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

module.exports = router;
