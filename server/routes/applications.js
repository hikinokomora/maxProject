const express = require('express');
const router = express.Router();
const applicationsService = require('../services/applicationsService');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/applications - Create new application (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Attach userId from authenticated user
    const data = {
      ...req.body,
      userId: req.user.id
    };
    
    const result = await applicationsService.createApplication(data);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/applications - Get all applications (for teachers/staff only)
router.get('/', authenticateToken, requireRole('TEACHER', 'STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { status, department } = req.query;
    const result = await applicationsService.getAllApplications({ status, department });
    res.json(result);
  } catch (error) {
    console.error('Applications list error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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

// GET /api/applications/:id - Get application by ID (authenticated users only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await applicationsService.getApplicationById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    // Students can only see their own applications
    if (req.user.role === 'STUDENT' && result.data.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/applications/student/:studentId - Get applications by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await applicationsService.getApplicationsByStudentId(studentId);
    res.json(result);
  } catch (error) {
    console.error('Student applications error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/applications/:id/status - Update application status (teachers/staff only)
router.patch('/:id/status', authenticateToken, requireRole('TEACHER', 'STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    
    const result = await applicationsService.updateApplicationStatus(id, status, req.user.name);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
