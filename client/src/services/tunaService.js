// Tuna SDK integration utilities
// SDK будет доступен через window.Tuna когда MAX добавит его

class TunaService {
  constructor() {
    this.tuna = null;
    this.initialized = false;
  }

  /**
   * Initialize Tuna SDK
   * Must be called when app starts
   */
  async init() {
    try {
      // Проверяем доступность Tuna SDK через window
      if (window.Tuna) {
        this.tuna = new window.Tuna();
        await this.tuna.ready();
        this.initialized = true;
        console.log('[Tuna] SDK initialized successfully');
      } else {
        console.log('[Tuna] Running in browser mode (Tuna SDK not available)');
        this.initialized = false;
      }
      return true;
    } catch (error) {
      console.error('[Tuna] Initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if running inside MAX messenger mini-app
   */
  isInMiniApp() {
    return this.initialized && this.tuna && this.tuna.platform !== 'web';
  }

  /**
   * Get current user info from Tuna
   * @returns {Promise<{id: number, firstName: string, lastName: string, username?: string}>}
   */
  async getUserInfo() {
    if (!this.initialized) {
      console.warn('[Tuna] SDK not initialized');
      return null;
    }

    try {
      const user = await this.tuna.getUserInfo();
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        fullName: `${user.first_name} ${user.last_name}`.trim()
      };
    } catch (error) {
      console.error('[Tuna] Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Show popup alert
   * @param {string} message - Alert message
   */
  async showAlert(message) {
    if (!this.initialized) {
      alert(message);
      return;
    }

    try {
      await this.tuna.showAlert(message);
    } catch (error) {
      console.error('[Tuna] Show alert failed:', error);
      alert(message);
    }
  }

  /**
   * Show popup confirmation
   * @param {string} message - Confirmation message
   * @returns {Promise<boolean>} - true if confirmed
   */
  async showConfirm(message) {
    if (!this.initialized) {
      return window.confirm(message);
    }

    try {
      return await this.tuna.showConfirm(message);
    } catch (error) {
      console.error('[Tuna] Show confirm failed:', error);
      return window.confirm(message);
    }
  }

  /**
   * Close mini-app
   */
  async close() {
    if (!this.initialized) {
      console.warn('[Tuna] Cannot close - not in mini-app');
      return;
    }

    try {
      await this.tuna.close();
    } catch (error) {
      console.error('[Tuna] Close failed:', error);
    }
  }

  /**
   * Open external link
   * @param {string} url - URL to open
   */
  async openLink(url) {
    if (!this.initialized) {
      window.open(url, '_blank');
      return;
    }

    try {
      await this.tuna.openLink(url);
    } catch (error) {
      console.error('[Tuna] Open link failed:', error);
      window.open(url, '_blank');
    }
  }

  /**
   * Send data to bot (if mini-app opened from bot)
   * @param {Object} data - Data to send
   */
  async sendDataToBot(data) {
    if (!this.initialized) {
      console.warn('[Tuna] Cannot send data - not in mini-app');
      return;
    }

    try {
      await this.tuna.sendData(JSON.stringify(data));
      console.log('[Tuna] Data sent to bot:', data);
    } catch (error) {
      console.error('[Tuna] Send data failed:', error);
    }
  }

  /**
   * Expand mini-app to full height
   */
  async expand() {
    if (!this.initialized) return;

    try {
      await this.tuna.expand();
    } catch (error) {
      console.error('[Tuna] Expand failed:', error);
    }
  }

  /**
   * Get launch params (data passed when mini-app was opened)
   */
  getLaunchParams() {
    if (!this.initialized) return null;

    try {
      const params = this.tuna.initDataUnsafe;
      return params;
    } catch (error) {
      console.error('[Tuna] Get launch params failed:', error);
      return null;
    }
  }

  /**
   * Set main button (shows at bottom of mini-app)
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   */
  setMainButton(text, onClick) {
    if (!this.initialized) return;

    try {
      this.tuna.MainButton.setText(text);
      this.tuna.MainButton.onClick(onClick);
      this.tuna.MainButton.show();
    } catch (error) {
      console.error('[Tuna] Set main button failed:', error);
    }
  }

  /**
   * Hide main button
   */
  hideMainButton() {
    if (!this.initialized) return;

    try {
      this.tuna.MainButton.hide();
    } catch (error) {
      console.error('[Tuna] Hide main button failed:', error);
    }
  }

  /**
   * Get theme colors from MAX messenger
   */
  getThemeParams() {
    if (!this.initialized) {
      return {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff'
      };
    }

    try {
      return this.tuna.themeParams;
    } catch (error) {
      console.error('[Tuna] Get theme failed:', error);
      return null;
    }
  }
}

// Singleton instance
const tunaService = new TunaService();

export default tunaService;
