// JWT-based authentication middleware
const authService = require('../services/authService');

/**
 * Middleware to authenticate user from JWT token
 * Expects Authorization header: "Bearer <token>"
 * Attaches user object to req.user if valid
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // For backward compatibility during migration, check old headers
    const legacyRole = req.header('X-User-Role');
    const legacyId = req.header('X-User-Id');
    
    if (legacyRole || legacyId) {
      // Legacy mode (temporary)
      const allowedRoles = ['STUDENT', 'TEACHER', 'STAFF', 'ADMIN'];
      req.user = {
        id: legacyId ? parseInt(legacyId) : undefined,
        role: allowedRoles.includes(legacyRole?.toUpperCase()) ? legacyRole.toUpperCase() : 'STUDENT',
        legacy: true
      };
      return next();
    }

    return res.status(401).json({ success: false, error: 'No authentication token provided' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware to require specific roles
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

module.exports = { 
  authenticateToken, 
  requireRole, 
  optionalAuth,
  // Legacy exports for compatibility
  attachUser: optionalAuth
};
