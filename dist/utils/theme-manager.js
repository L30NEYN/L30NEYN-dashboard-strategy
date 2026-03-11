/**
 * HA Custom Dashboard Strategy - Theme Manager
 * 
 * Manages theme application and switching.
 * Handles light/dark mode and custom color schemes.
 * 
 * @version 1.1.0
 */

window.HaCustomThemeManager = {
  /**
   * Current theme configuration
   */
  currentTheme: {
    mode: 'auto', // 'auto', 'light', 'dark'
    colorScheme: 'default', // 'default', 'blue', 'green', 'purple', 'red', 'orange', 'teal'
  },

  /**
   * Initialize theme manager
   * @param {Object} config - Theme configuration
   */
  init(config = {}) {
    console.info('[Theme Manager] Initializing...');

    // Load theme from config or storage
    this.currentTheme = {
      mode: config.theme_mode || this.loadFromStorage('theme_mode') || 'auto',
      colorScheme: config.color_scheme || this.loadFromStorage('color_scheme') || 'default',
    };

    // Apply theme
    this.applyTheme();

    // Listen to system theme changes
    if (this.currentTheme.mode === 'auto') {
      this.watchSystemTheme();
    }

    console.info('[Theme Manager] Initialized with:', this.currentTheme);
  },

  /**
   * Apply current theme
   */
  applyTheme() {
    const root = document.documentElement;

    // Apply theme mode
    if (this.currentTheme.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', this.currentTheme.mode);
    }

    // Apply color scheme
    if (this.currentTheme.colorScheme !== 'default') {
      root.setAttribute('data-color-scheme', this.currentTheme.colorScheme);
    } else {
      root.removeAttribute('data-color-scheme');
    }

    console.info('[Theme Manager] Theme applied:', {
      mode: root.getAttribute('data-theme'),
      colorScheme: this.currentTheme.colorScheme,
    });
  },

  /**
   * Set theme mode
   * @param {string} mode - 'auto', 'light', or 'dark'
   */
  setMode(mode) {
    if (!['auto', 'light', 'dark'].includes(mode)) {
      console.warn('[Theme Manager] Invalid mode:', mode);
      return;
    }

    this.currentTheme.mode = mode;
    this.saveToStorage('theme_mode', mode);
    this.applyTheme();

    if (mode === 'auto') {
      this.watchSystemTheme();
    }

    console.info('[Theme Manager] Mode changed to:', mode);
  },

  /**
   * Set color scheme
   * @param {string} scheme - Color scheme name
   */
  setColorScheme(scheme) {
    const validSchemes = ['default', 'blue', 'green', 'purple', 'red', 'orange', 'teal'];
    
    if (!validSchemes.includes(scheme)) {
      console.warn('[Theme Manager] Invalid color scheme:', scheme);
      return;
    }

    this.currentTheme.colorScheme = scheme;
    this.saveToStorage('color_scheme', scheme);
    this.applyTheme();

    console.info('[Theme Manager] Color scheme changed to:', scheme);
  },

  /**
   * Get current theme
   * @returns {Object} Current theme configuration
   */
  getTheme() {
    return { ...this.currentTheme };
  },

  /**
   * Watch for system theme changes
   */
  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e) => {
      if (this.currentTheme.mode === 'auto') {
        this.applyTheme();
        console.info('[Theme Manager] System theme changed, reapplying...');
      }
    };

    // Remove old listener if exists
    if (this._systemThemeListener) {
      mediaQuery.removeEventListener('change', this._systemThemeListener);
    }

    // Add new listener
    mediaQuery.addEventListener('change', handler);
    this._systemThemeListener = handler;
  },

  /**
   * Save to browser storage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`ha_custom_${key}`, value);
    } catch (error) {
      console.warn('[Theme Manager] Could not save to storage:', error);
    }
  },

  /**
   * Load from browser storage
   * @param {string} key - Storage key
   * @returns {string|null} Stored value
   */
  loadFromStorage(key) {
    try {
      return localStorage.getItem(`ha_custom_${key}`);
    } catch (error) {
      console.warn('[Theme Manager] Could not load from storage:', error);
      return null;
    }
  },

  /**
   * Get available color schemes
   * @returns {Array} List of color scheme objects
   */
  getAvailableColorSchemes() {
    return [
      { id: 'default', name: 'Standard', icon: 'mdi:palette' },
      { id: 'blue', name: 'Blau', icon: 'mdi:palette', color: '#2196f3' },
      { id: 'green', name: 'Grün', icon: 'mdi:palette', color: '#4caf50' },
      { id: 'purple', name: 'Lila', icon: 'mdi:palette', color: '#9c27b0' },
      { id: 'red', name: 'Rot', icon: 'mdi:palette', color: '#f44336' },
      { id: 'orange', name: 'Orange', icon: 'mdi:palette', color: '#ff9800' },
      { id: 'teal', name: 'Türkis', icon: 'mdi:palette', color: '#009688' },
    ];
  },
};

console.info('[Theme Manager] Module loaded');
