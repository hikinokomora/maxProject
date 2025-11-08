// Authentication service with JWT and bcrypt
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user
   * @param {Object} data - User registration data
   * @param {string} data.email - User email (unique)
   * @param {string} data.password - Plain text password
   * @param {string} data.name - Full name
   * @param {string} [data.role] - User role (defaults to STUDENT)
   * @param {number} [data.maxUserId] - MAX messenger user ID (optional)
   * @returns {Promise<{success: boolean, data?: Object, message?: string, token?: string}>}
   */
  async register(data) {
    try {
      const { email, password, name, role = 'STUDENT', maxUserId } = data;

      // Validate input
      if (!email || !password || !name) {
        return { success: false, message: 'Email, password, and name are required' };
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          maxUserId
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          maxUserId: true,
          createdAt: true
        }
      });

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        data: user,
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('[AuthService] Registration error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<{success: boolean, data?: Object, message?: string, token?: string}>}
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Generate token
      const token = this.generateToken(user);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      maxUserId: user.maxUserId
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Get user by ID (without password)
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          maxUserId: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return user;
    } catch (error) {
      console.error('[AuthService] Get user error:', error);
      return null;
    }
  }

  /**
   * Link MAX messenger user ID to existing account
   * @param {number} userId - Database user ID
   * @param {number} maxUserId - MAX messenger user ID
   * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
   */
  async linkMaxUserId(userId, maxUserId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { maxUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          maxUserId: true
        }
      });
      return { success: true, data: user };
    } catch (error) {
      console.error('[AuthService] Link MAX user error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Find or create user by MAX user ID (for bot authentication)
   * @param {number} maxUserId - MAX messenger user ID
   * @param {Object} [userData] - Optional user data for creation
   * @returns {Promise<Object|null>}
   */
  async findOrCreateByMaxUserId(maxUserId, userData = {}) {
    try {
      // Try to find existing user
      let user = await prisma.user.findUnique({ where: { maxUserId } });
      
      if (!user && userData.email) {
        // Create temporary user if they don't exist
        const tempPassword = await bcrypt.hash(Math.random().toString(36), SALT_ROUNDS);
        user = await prisma.user.create({
          data: {
            maxUserId,
            email: userData.email || `max_${maxUserId}@temp.local`,
            name: userData.name || `User ${maxUserId}`,
            password: tempPassword,
            role: userData.role || 'STUDENT'
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            maxUserId: true
          }
        });
      }
      
      return user;
    } catch (error) {
      console.error('[AuthService] Find/Create user error:', error);
      return null;
    }
  }
}

module.exports = new AuthService();
