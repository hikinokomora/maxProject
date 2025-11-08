// Authentication routes - registration, login, profile
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, name, role? }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    const result = await authService.register({
      email,
      password,
      name,
      role
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[Auth Routes] Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('[Auth Routes] Get profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/link-max
 * Link MAX messenger ID to current account
 * Body: { maxUserId }
 */
router.post('/link-max', authenticateToken, async (req, res) => {
  try {
    const { maxUserId } = req.body;
    
    if (!maxUserId) {
      return res.status(400).json({ success: false, error: 'maxUserId is required' });
    }

    const result = await authService.linkMaxUserId(req.user.id, maxUserId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Auth Routes] Link MAX error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/tuna-login
 * Auto-login/register user from Tuna (MAX mini-app)
 * Body: { maxUserId, name, firstName?, lastName?, username? }
 */
router.post('/tuna-login', async (req, res) => {
  try {
    const { maxUserId, name, firstName, lastName, username } = req.body;
    
    if (!maxUserId) {
      return res.status(400).json({ success: false, error: 'maxUserId is required' });
    }

    // Find or create user by MAX user ID
    let user = await authService.findOrCreateByMaxUserId(maxUserId, {
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || `User ${maxUserId}`,
      email: username ? `${username}@max.local` : `user_${maxUserId}@max.local`,
      role: 'STUDENT'
    });

    if (!user) {
      return res.status(500).json({ success: false, error: 'Failed to authenticate user' });
    }

    // Generate token
    const token = authService.generateToken(user);

    res.json({
      success: true,
      data: user,
      token,
      message: 'Authenticated via Tuna'
    });
  } catch (error) {
    console.error('[Auth Routes] Tuna login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
