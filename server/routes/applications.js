const express = require('express');
const router = express.Router();
const applicationsService = require('../services/applicationsService');

// POST /api/applications - Create new application
router.post('/', (req, res) => {
  try {
    const result = applicationsService.createApplication(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/applications/types - Get application types
router.get('/types', (req, res) => {
  try {
    const result = applicationsService.getApplicationTypes();
    res.json(result);
  } catch (error) {
    console.error('Application types error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/applications/:id - Get application by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = applicationsService.getApplicationById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/applications/student/:studentId - Get applications by student ID
router.get('/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const result = applicationsService.getApplicationsByStudentId(studentId);
    res.json(result);
  } catch (error) {
    console.error('Student applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
