const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// POST /api/chat - Process chat message
router.post('/', (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = chatService.processMessage(message);
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chat/info - Get university info
router.get('/info', (req, res) => {
  try {
    const info = chatService.getUniversityInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
