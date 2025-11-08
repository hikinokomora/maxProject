// Authentication service for web app with Tuna integration
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  /**
   * Register new user
   */
  async register(email, password, name, role = 'STUDENT') {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
        role
      });

      if (response.data.success) {
        this.setAuth(response.data.token, response.data.data);
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Login with email/password
   */
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        this.setAuth(response.data.token, response.data.data);
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Auto-authenticate user from MAX messenger (Tuna)
   * Creates or finds user by MAX user ID
   */
  async authenticateWithTuna(tunaUserInfo) {
    try {
      // Try to get existing token for this MAX user
      const cachedToken = localStorage.getItem(`tuna_token_${tunaUserInfo.id}`);
      
      if (cachedToken) {
        // Verify token is still valid
        const valid = await this.verifyToken(cachedToken);
        if (valid) {
          this.setAuth(cachedToken, valid.data);
          return { success: true, data: valid.data, token: cachedToken };
        }
      }

      // Register/login with MAX user info
      // Backend should handle findOrCreateByMaxUserId
      const response = await axios.post(`${API_URL}/auth/tuna-login`, {
        maxUserId: tunaUserInfo.id,
        name: tunaUserInfo.fullName,
        firstName: tunaUserInfo.firstName,
        lastName: tunaUserInfo.lastName,
        username: tunaUserInfo.username
      });

      if (response.data.success) {
        this.setAuth(response.data.token, response.data.data);
        localStorage.setItem(`tuna_token_${tunaUserInfo.id}`, response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Tuna auth error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(token) {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        this.user = response.data.data;
        localStorage.setItem('user', JSON.stringify(this.user));
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Get profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Logout
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Set authentication
   */
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get current token
   */
  getToken() {
    return this.token;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

const authService = new AuthService();
export default authService;
